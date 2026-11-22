import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Order } from '../models/Order.js';
import { PaymentAttempt } from '../models/PaymentAttempt.js';
import { PaymentEvent } from '../models/PaymentEvent.js';
import { verifyCashfreeWebhook } from '../payments/cashfreeWebhook.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { paymentProviderUnavailable } from '../payments/provider.js';
import { CashfreeSandboxProvider } from '../payments/cashfreeProvider.js';
import { inTransaction } from '../orders/inventory.js';
import { FinancialEvent } from '../models/FinancialEvent.js';
import crypto from 'node:crypto';
import { Shipment } from '../models/Shipment.js';
import { DeliveryVerification } from '../models/DeliveryVerification.js';
import { ensurePayoutRecord } from '../payouts/ledger.js';
import { CourierWebhookEvent } from '../models/CourierWebhookEvent.js';

export const paymentsRouter = Router();
paymentsRouter.post('/webhooks/courier', asyncHandler(async (req, res) => {
  const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
  const timestamp = req.get('x-courier-timestamp') || '';
  const signature = req.get('x-courier-signature') || '';
  const secret = env.COURIER_WEBHOOK_SECRET;
  if (!secret || !rawBody) { res.status(401).json({ error: 'Courier webhook verification is unavailable' }); return; }
  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds) || Math.abs(Date.now() - timestampSeconds * 1000) > 5 * 60 * 1000) {
    res.status(401).json({ error: 'Courier webhook timestamp is missing or outside the replay window' }); return;
  }
  const expected = crypto.createHmac('sha256', secret).update(timestamp + rawBody.toString('utf8')).digest('hex');
  let validSignature = false;
  try { validSignature = signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch { validSignature = false; }
  if (!validSignature) { res.status(401).json({ error: 'Invalid courier webhook signature' }); return; }
  let payload: unknown;
  try { payload = JSON.parse(rawBody.toString('utf8')); } catch { res.status(400).json({ error: 'Invalid courier webhook JSON' }); return; }
  const schema = z.object({
    orderId: z.string().regex(/^[a-f\d]{24}$/i),
    trackingId: z.string().trim().min(3).max(200),
    eventId: z.string().trim().min(8).max(200),
    deliveredAt: z.string().datetime({ offset: true }),
  }).strict();
  const event = schema.parse(payload);
  const duplicate = await CourierWebhookEvent.findOne({ eventId: event.eventId });
  if (duplicate) { res.status(200).json({ received: true, duplicate: true }); return; }
  try {
    const verification = await inTransaction(async (session) => {
      const recorded = await CourierWebhookEvent.findOne({ eventId: event.eventId }).session(session);
      if (recorded) return { duplicate: true, verification: null };
      const order = await Order.findById(event.orderId).session(session);
      if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
      if (order.paymentStatus !== 'paid') throw Object.assign(new Error('Only paid orders can be delivery verified'), { status: 409 });
      if (order.status === 'cancelled' || ['refunded', 'partially_refunded'].includes(order.paymentStatus) || order.disputeStatus === 'open') {
        throw Object.assign(new Error('Cancelled, refunded or disputed orders cannot be delivery verified'), { status: 409 });
      }
      const shipment = await Shipment.findOne({ order: order._id, trackingId: event.trackingId }).session(session);
      if (!shipment) throw Object.assign(new Error('Courier tracking reference does not match the shipment'), { status: 409 });
      await CourierWebhookEvent.create([{ eventId: event.eventId, order: order._id, trackingId: event.trackingId, deliveredAt: new Date(event.deliveredAt) }], { session });
      const existing = await DeliveryVerification.findOne({ order: order._id }).session(session);
      if (existing?.status === 'verified') return { duplicate: true, verification: existing };
      const result = await DeliveryVerification.findOneAndUpdate(
        { order: order._id },
        { $set: { status: 'verified', source: 'trusted_courier', trackingReference: event.trackingId, verifiedAt: new Date(event.deliveredAt), evidence: `courier-event:${event.eventId}` }, $push: { auditHistory: { action: 'courier_webhook', source: 'trusted_courier', trackingReference: event.trackingId, evidence: `courier-event:${event.eventId}`, at: new Date(event.deliveredAt) } } },
        { new: true, upsert: true, runValidators: true, session },
      );
      await Order.updateOne({ _id: order._id, status: { $ne: 'cancelled' }, paymentStatus: { $nin: ['refunded', 'partially_refunded'] }, disputeStatus: { $ne: 'open' } }, { $set: { status: 'delivered' } }, { session });
      await ensurePayoutRecord(order, session);
      return { duplicate: false, verification: result };
    });
    res.status(200).json({ received: true, ...(verification.duplicate ? { duplicate: true } : {}), ...(verification.verification ? { verification: verification.verification } : {}) });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) { res.status(200).json({ received: true, duplicate: true }); return; }
    throw error;
  }
}));

const webhookSchema = z.object({
  type: z.string().min(1).max(100), event_time: z.string().datetime({ offset: true }),
  data: z.object({
    order: z.object({ order_id: z.string().min(1).max(200), order_amount: z.number().nonnegative(), order_currency: z.string().length(3) }),
    payment: z.object({ cf_payment_id: z.union([z.string(), z.number()]).transform(String), payment_status: z.enum(['SUCCESS', 'FAILED', 'USER_DROPPED', 'PENDING', 'AUTHORIZED']), payment_amount: z.number().nonnegative(), payment_currency: z.string().length(3) }),
  }),
}).passthrough();

paymentsRouter.post('/webhooks/cashfree', asyncHandler(async (req, res) => {
  const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
  const timestamp = req.get('x-webhook-timestamp') || '';
  const signature = req.get('x-webhook-signature') || '';
  const secret = env.CASHFREE_WEBHOOK_SECRET;
  if (!secret || !rawBody || !verifyCashfreeWebhook(rawBody, timestamp, signature, secret)) { res.status(401).json({ error: 'Invalid payment webhook signature' }); return; }
  let parsedJson: unknown;
  try { parsedJson = JSON.parse(rawBody.toString('utf8')); }
  catch { res.status(400).json({ error: 'Invalid webhook JSON' }); return; }
  const event = webhookSchema.parse(parsedJson);
  const { order: providerOrder, payment } = event.data;
  const amountPaise = rupeesToPaise(payment.payment_amount);
  const orderAmountPaise = rupeesToPaise(providerOrder.order_amount);
  if (providerOrder.order_currency !== 'INR' || payment.payment_currency !== 'INR' || amountPaise === null || orderAmountPaise === null) { res.status(400).json({ error: 'Invalid payment currency or amount' }); return; }
  const attempt = await PaymentAttempt.findOne({ provider: 'cashfree', providerOrderId: providerOrder.order_id });
  if (!attempt) { res.status(404).json({ error: 'Payment attempt not found' }); return; }
  if (attempt.amountPaise !== orderAmountPaise || attempt.amountPaise !== amountPaise) { res.status(409).json({ error: 'Payment amount does not match the order' }); return; }
  if (paymentProviderUnavailable()) { res.status(503).json({ error: 'Provider verification is unavailable; payment state was not changed' }); return; }
  const paymentStatus = payment.payment_status;
  let verifiedPayment;
  try { verifiedPayment = await new CashfreeSandboxProvider().fetchPayment(providerOrder.order_id, payment.cf_payment_id); }
  catch (error) {
    console.error(JSON.stringify({ event: 'cashfree_payment_verification_unavailable', attemptId: attempt.id, error: error instanceof Error ? error.message : 'unknown' }));
    res.status(503).json({ error: 'Payment could not be verified with Cashfree; retry the webhook' }); return;
  }
  const expectedStatus = paymentStatus === 'SUCCESS' ? 'paid' : paymentStatus === 'FAILED' || paymentStatus === 'USER_DROPPED' ? 'failed' : paymentStatus === 'AUTHORIZED' ? 'authorized' : 'pending';
  if (verifiedPayment.providerOrderId !== attempt.providerOrderId || verifiedPayment.amountPaise !== attempt.amountPaise || verifiedPayment.currency !== attempt.currency || verifiedPayment.status !== expectedStatus) { res.status(409).json({ error: 'Webhook data does not match Cashfree payment status' }); return; }
  const eventKind = paymentStatus === 'SUCCESS' ? 'payment_succeeded' : paymentStatus === 'FAILED' || paymentStatus === 'USER_DROPPED' ? 'payment_failed' : paymentStatus === 'AUTHORIZED' ? 'payment_authorized' : 'payment_pending';
  const eventKey = `cashfree:${payment.cf_payment_id}:${paymentStatus}:${event.event_time}`;
  try {
    const duplicate = await inTransaction(async (session) => {
      const eventRecord = await PaymentEvent.findOne({ provider: 'cashfree', providerEventId: eventKey }).session(session);
      if (eventRecord?.processingStatus === 'processed') return true;
      const order = await Order.findById(attempt.order).session(session);
      if (!order || order.totalPaise !== amountPaise) throw Object.assign(new Error('Local order amount does not match provider payment'), { status: 409 });
      const eventDoc = eventRecord || (await PaymentEvent.create([{ provider: 'cashfree', providerEventId: eventKey, attempt: attempt._id, order: attempt.order, kind: eventKind, amountPaise, providerReference: payment.cf_payment_id }], { session }))[0]!;
      if (paymentStatus === 'SUCCESS') {
        await PaymentAttempt.updateOne({ _id: attempt._id, status: { $nin: ['refunded', 'partially_refunded'] } }, { $set: { status: 'paid', providerPaymentId: payment.cf_payment_id, completedAt: new Date() } }, { session });
        await Order.updateOne({ _id: order._id, paymentStatus: { $nin: ['refunded', 'partially_refunded'] } }, { $set: { paymentStatus: 'paid' } }, { session });
        const financialEventId = `cashfree-payment:${payment.cf_payment_id}`;
        if (!await FinancialEvent.exists({ provider: 'cashfree', providerEventId: financialEventId }).session(session)) {
          await FinancialEvent.create([{ provider: 'cashfree', providerEventId: financialEventId, kind: 'payment_captured', order: order._id, paymentAttempt: attempt._id, seller: order.seller, currency: 'INR', amountPaise, sellerCommissionPaise: order.sellerCommissionPaise ?? order.platformCommissionPaise, buyerMarketplaceFeePaise: order.buyerMarketplaceFeePaise ?? 0, platformCommissionPaise: order.platformCommissionPaise, sellerSharePaise: order.sellerSharePaise, providerReference: payment.cf_payment_id, occurredAt: new Date(event.event_time) }], { session });
        }
      } else if (paymentStatus === 'FAILED' || paymentStatus === 'USER_DROPPED') {
        await PaymentAttempt.updateOne({ _id: attempt._id, status: { $nin: ['paid', 'refunded', 'partially_refunded'] } }, { $set: { status: 'failed', providerPaymentId: payment.cf_payment_id, completedAt: new Date() } }, { session });
        await Order.updateOne({ _id: order._id, paymentStatus: { $nin: ['paid', 'refunded', 'partially_refunded'] } }, { $set: { paymentStatus: 'failed' } }, { session });
      } else if (paymentStatus === 'AUTHORIZED') {
        await PaymentAttempt.updateOne({ _id: attempt._id, status: { $nin: ['paid', 'refunded', 'partially_refunded'] } }, { $set: { status: 'authorized', providerPaymentId: payment.cf_payment_id } }, { session });
        await Order.updateOne({ _id: order._id, paymentStatus: { $nin: ['paid', 'refunded', 'partially_refunded'] } }, { $set: { paymentStatus: 'authorized' } }, { session });
      }
      await PaymentEvent.updateOne({ _id: eventDoc._id }, { $set: { processingStatus: 'processed', processedAt: new Date() } }, { session });
      return false;
    });
    res.status(200).json({ received: true, ...(duplicate ? { duplicate: true } : {}) });
  } catch (error) {
    if ((error as { code?: number }).code === 11000 && await PaymentEvent.exists({ provider: 'cashfree', providerEventId: eventKey, processingStatus: 'processed' })) { res.status(200).json({ received: true, duplicate: true }); return; }
    throw error;
  }
}));

function rupeesToPaise(value: number): number | null {
  const paise = Math.round(value * 100);
  return Number.isFinite(value) && Number.isSafeInteger(paise) && Math.abs(value * 100 - paise) < 0.000001 ? paise : null;
}
