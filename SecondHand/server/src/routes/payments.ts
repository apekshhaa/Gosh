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

export const paymentsRouter = Router();
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
          await FinancialEvent.create([{ provider: 'cashfree', providerEventId: financialEventId, kind: 'payment_captured', order: order._id, paymentAttempt: attempt._id, seller: order.seller, currency: 'INR', amountPaise, platformCommissionPaise: order.platformCommissionPaise, sellerSharePaise: order.sellerSharePaise, providerReference: payment.cf_payment_id, occurredAt: new Date(event.event_time) }], { session });
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
