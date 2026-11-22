import { Router } from 'express';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { requireAuth, requireApprovedSeller, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { env } from '../config/env.js';
import { calculateCommission } from '../payments/commission.js';
import { PaymentAttempt } from '../models/PaymentAttempt.js';
import { User } from '../models/User.js';
import { cancelUnpaidReservation, inTransaction } from '../orders/inventory.js';
import { CashfreeSandboxProvider } from '../payments/cashfreeProvider.js';
import { paymentProviderUnavailable } from '../payments/provider.js';
import { Shipment } from '../models/Shipment.js';
import { DeliveryVerification } from '../models/DeliveryVerification.js';
import { Payout } from '../models/Payout.js';
import { ensurePayoutRecord } from '../payouts/ledger.js';
import { BuyerDeliveryAcknowledgement } from '../models/BuyerDeliveryAcknowledgement.js';

export const ordersRouter = Router();
const createLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, skip: () => env.NODE_ENV === 'test' });
const deliveryAddressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()).default('IN'),
}).strict();
const itemsSchema = z.object({
  items: z.array(z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().int().min(1).max(20), selectedSize: z.string().trim().min(1).max(30).optional() }).strict()).min(1).max(20),
  deliveryAddress: deliveryAddressSchema.optional(),
}).strict();
const idSchema = z.string().regex(/^[a-f\d]{24}$/i);
const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25), status: z.enum(['pending_fulfillment', 'processing', 'shipped', 'delivered']).optional() });
const sellerStatusSchema = z.object({ status: z.enum(['processing']) }).strict();
const adminStatusSchema = z.object({ status: z.enum(['processing']), reason: z.string().trim().min(5).max(1000) }).strict();
const shipmentSchema = z.object({
  courierName: z.string().trim().min(2).max(100),
  trackingId: z.string().trim().min(3).max(200),
  shippedAt: z.string().datetime({ offset: true }),
}).strict();
const buyerDeliverySchema = z.object({ trackingReference: z.string().trim().min(3).max(200) }).strict();
// Approved sellers can also shop as buyers for listings they do not own.
const BUYER = [requireAuth, requireRole('buyer', 'seller')];
const SELLER = [requireAuth, requireRole('seller'), requireApprovedSeller];
const ADMIN = [requireAuth, requireRole('admin')];

ordersRouter.post('/', ...BUYER, createLimiter, asyncHandler(async (req, res) => {
  const input = itemsSchema.parse(req.body);
  const key = req.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 128 || !/^[\w.-]+$/.test(key)) { res.status(400).json({ error: 'A valid Idempotency-Key header is required' }); return; }
  const canonical = [...input.items].sort((a, b) => a.productId.localeCompare(b.productId));
  const requestHash = crypto.createHash('sha256').update(JSON.stringify({ items: canonical, deliveryAddress: input.deliveryAddress ?? null })).digest('hex');
  const existing = await Order.findOne({ buyer: req.authUser!.id, idempotencyKey: key }).select('+requestHash');
  if (existing) {
    if (existing.requestHash !== requestHash) { res.status(409).json({ error: 'Idempotency key was already used for a different request' }); return; }
    res.status(200).json({ order: existing, replayed: true }); return;
  }
  try {
    const result = await inTransaction(async (session) => {
      const raced = await Order.findOne({ buyer: req.authUser!.id, idempotencyKey: key }).select('+requestHash').session(session);
      if (raced) {
        if (raced.requestHash !== requestHash) throw Object.assign(new Error('Idempotency key was already used for a different request'), { status: 409 });
        return { order: raced, replayed: true };
      }
      const ids = canonical.map((item) => new mongoose.Types.ObjectId(item.productId));
      const products = await Product.find({ _id: { $in: ids }, status: 'approved', inventory: { $gt: 0 } }).session(session);
      if (products.length !== canonical.length) throw Object.assign(new Error('One or more listings are unavailable'), { status: 409 });
      const sellerIds = new Set(products.map((product) => String(product.seller)));
      if (sellerIds.size !== 1) throw Object.assign(new Error('An order can contain items from only one seller'), { status: 400 });
      if (sellerIds.has(req.authUser!.id)) throw Object.assign(new Error('You cannot purchase your own listings'), { status: 400 });
      const byId = new Map(products.map((product) => [String(product._id), product]));
      const snapshots = canonical.map((line) => {
        const product = byId.get(line.productId)!;
        if (line.selectedSize && line.selectedSize.toLowerCase() !== product.size.toLowerCase()) throw Object.assign(new Error(`Selected size is unavailable for ${product.title}`), { status: 400 });
        return { product, line };
      });
      for (const { product, line } of snapshots) {
        const result = await Product.updateOne({ _id: product._id, seller: product.seller, status: 'approved', inventory: { $gte: line.quantity } }, { $inc: { inventory: -line.quantity } }, { session });
        if (result.modifiedCount !== 1) throw Object.assign(new Error(`Insufficient inventory for ${product.title}`), { status: 409 });
      }
      const items = snapshots.map(({ product, line }) => ({ product: product._id, title: product.title, selectedSize: product.size, quantity: line.quantity, unitPricePaise: product.pricePaise, imageReference: product.imageUrls[0] || '' }));
      const subtotalBig = items.reduce((sum, item) => sum + BigInt(item.unitPricePaise) * BigInt(item.quantity), 0n);
      if (subtotalBig > BigInt(Number.MAX_SAFE_INTEGER)) throw Object.assign(new Error('Order total is too large'), { status: 400 });
      const subtotal = Number(subtotalBig);
      const commission = calculateCommission(subtotal);
      const [created] = await Order.create([{ orderNumber: `GSH-${crypto.randomBytes(8).toString('hex').toUpperCase()}`, buyer: req.authUser!.id, seller: [...sellerIds][0], idempotencyKey: key, requestHash, items, ...(input.deliveryAddress ? { deliveryAddress: input.deliveryAddress } : {}), itemSubtotalPaise: subtotal, shippingPaise: 0, discountsPaise: 0, taxesPaise: 0, totalPaise: subtotal, commissionRateBps: commission.rateBps, commissionBasisPaise: commission.eligibleSubtotalPaise, sellerCommissionPaise: commission.sellerCommissionPaise, buyerMarketplaceFeePaise: 0, platformCommissionPaise: commission.sellerCommissionPaise, sellerSharePaise: commission.sellerSharePaise, paymentStatus: 'unpaid', status: 'pending_fulfillment', reservationExpiresAt: new Date(Date.now() + 20 * 60 * 1000) }], { session });
      return { order: created!, replayed: false };
    });
    res.status(result.replayed ? 200 : 201).json({ order: result.order, ...(result.replayed ? { replayed: true } : {}) });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      const raced = await Order.findOne({ buyer: req.authUser!.id, idempotencyKey: key }).select('+requestHash');
      if (raced?.requestHash === requestHash) { res.status(200).json({ order: raced, replayed: true }); return; }
    }
    throw error;
  }
}));

ordersRouter.post('/:id/payment-attempts', ...BUYER, createLimiter, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const key = req.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 128 || !/^[\w.-]+$/.test(key)) { res.status(400).json({ error: 'A valid Idempotency-Key header is required' }); return; }
  const order = await Order.findOne({ _id: id, buyer: req.authUser!.id });
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  if (paymentProviderUnavailable()) { res.status(503).json({ error: 'Cashfree sandbox payment is disabled until all sandbox configuration is valid' }); return; }
  if (order.paymentStatus === 'paid' || ['refunded', 'partially_refunded'].includes(order.paymentStatus)) { res.status(409).json({ error: 'This order cannot accept another payment attempt' }); return; }
  if (order.status !== 'pending_fulfillment' || order.inventoryReleasedAt || order.reservationExpiresAt <= new Date()) { res.status(409).json({ error: 'Order inventory reservation has expired or is no longer payable' }); return; }
  const user = await User.findById(req.authUser!.id).select('phone');
  if (!user?.phone) { res.status(400).json({ error: 'Add a phone number to your account before starting payment' }); return; }
  const providerOrderId = `GSH${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
  let attempt;
  try {
    attempt = await inTransaction(async (session) => {
      const sameKey = await PaymentAttempt.findOne({ order: order._id, idempotencyKey: key }).select('+paymentSessionId').session(session);
      if (sameKey) return sameKey;
      const currentOrder = await Order.findOne({ _id: order._id, buyer: req.authUser!.id, paymentStatus: { $in: ['unpaid', 'pending', 'failed'] }, status: 'pending_fulfillment', inventoryReleasedAt: null, reservationExpiresAt: { $gt: new Date() } }).session(session);
      if (!currentOrder) throw Object.assign(new Error('Order is no longer payable'), { status: 409 });
      const [created] = await PaymentAttempt.create([{ order: order._id, buyer: req.authUser!.id, provider: 'cashfree', idempotencyKey: key, amountPaise: order.totalPaise, currency: 'INR', providerOrderId, status: 'pending', expiresAt: order.reservationExpiresAt }], { session });
      await Order.updateOne({ _id: order._id, paymentStatus: { $in: ['unpaid', 'failed'] }, inventoryReleasedAt: null }, { $set: { paymentStatus: 'pending' } }, { session });
      return created!;
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) attempt = await PaymentAttempt.findOne({ order: order._id, idempotencyKey: key }).select('+paymentSessionId');
    else throw error;
  }
  if (!attempt) throw new Error('Payment attempt could not be initialized');
  if (!attempt.paymentSessionId) {
    const provider = new CashfreeSandboxProvider();
    try {
      const session = await provider.createPayment({ providerOrderId: attempt.providerOrderId, amountPaise: attempt.amountPaise, currency: 'INR', customerId: req.authUser!.id, customerPhone: user.phone, returnUrl: `${env.CLIENT_ORIGIN}/orders/${order.id}`, notifyUrl: env.CASHFREE_NOTIFY_URL!, expiresAt: attempt.expiresAt }, attempt.idempotencyKey);
      attempt.paymentSessionId = session.paymentSessionId;
      if (session.expiresAt) attempt.expiresAt = session.expiresAt;
      await attempt.save();
    } catch (error) {
      // Network errors are indeterminate: retain the same provider order/idempotency key for safe retry.
      console.error(JSON.stringify({ event: 'cashfree_order_creation_unconfirmed', attemptId: attempt.id, error: error instanceof Error ? error.message : 'unknown' }));
      res.status(503).json({ error: 'Payment session status is not confirmed; retry with the same Idempotency-Key' }); return;
    }
  }
  res.status(201).json({ attempt: { id: attempt.id, status: attempt.status, amountPaise: attempt.amountPaise, currency: attempt.currency }, paymentSessionId: attempt.paymentSessionId, environment: 'sandbox' });
}));

ordersRouter.post('/:id/cancel', ...BUYER, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const released = await cancelUnpaidReservation(id, req.authUser!.id);
  if (!released) { res.status(409).json({ error: 'Order cannot be cancelled while payment is active or fulfillment has started' }); return; }
  res.status(200).json({ cancelled: true });
}));

ordersRouter.get('/mine', ...BUYER, asyncHandler(async (req, res) => {
  const query = pageSchema.parse(req.query);
  const filter = { buyer: req.authUser!.id, ...(query.status ? { status: query.status } : {}) };
  const [orders, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit), Order.countDocuments(filter)]);
  res.json({ orders, page: query.page, limit: query.limit, total });
}));
ordersRouter.get('/mine/:id', ...BUYER, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const order = await Order.findOne({ _id: id, buyer: req.authUser!.id });
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  res.json({ order });
}));

ordersRouter.get('/seller', ...SELLER, asyncHandler(async (req, res) => {
  const query = pageSchema.parse(req.query);
  const filter = { seller: req.authUser!.id, ...(query.status ? { status: query.status } : {}) };
  const [orders, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).populate('buyer', 'name'), Order.countDocuments(filter)]);
  res.json({ orders, page: query.page, limit: query.limit, total });
}));

ordersRouter.get('/seller/payouts', ...SELLER, asyncHandler(async (req, res) => {
  const orders = await Order.find({ seller: req.authUser!.id }).sort({ createdAt: -1 }).limit(100);
  for (const order of orders) await ensurePayoutRecord(order);
  const payouts = await Payout.find({ seller: req.authUser!.id }).sort({ createdAt: -1 }).limit(100).populate('order', 'orderNumber status paymentStatus');
  res.json({ payouts, provider: 'disabled', enabled: false });
}));
ordersRouter.patch('/seller/:id/status', ...SELLER, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id); const { status } = sellerStatusSchema.parse(req.body);
  const order = await Order.findOne({ _id: id, seller: req.authUser!.id });
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  if (order.paymentStatus !== 'paid') { res.status(409).json({ error: 'Fulfillment cannot advance before payment is verified' }); return; }
  if (!canAdvance(order.status, status)) { res.status(409).json({ error: 'Invalid fulfillment status transition' }); return; }
  const fromStatus = order.status;
  const updated = await Order.findOneAndUpdate({ _id: id, seller: req.authUser!.id, status: fromStatus }, { $set: { status }, $push: { statusHistory: { actor: req.authUser!.id, action: 'seller_fulfillment', fromStatus, toStatus: status, at: new Date() } } }, { new: true, runValidators: true });
  if (!updated) { res.status(409).json({ error: 'Order status changed; reload and try again' }); return; }
  res.json({ order: updated });
}));

ordersRouter.post('/seller/:id/shipment', ...SELLER, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const input = shipmentSchema.parse(req.body);
  const order = await Order.findOne({ _id: id, seller: req.authUser!.id });
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  if (order.paymentStatus !== 'paid') { res.status(409).json({ error: 'Shipment cannot be submitted before payment is confirmed' }); return; }
  if (order.status === 'cancelled' || ['refunded', 'partially_refunded'].includes(order.paymentStatus) || order.disputeStatus === 'open') {
    res.status(409).json({ error: 'Shipment cannot be submitted for a cancelled, refunded or disputed order' }); return;
  }
  if (await Shipment.exists({ order: order._id })) { res.status(409).json({ error: 'Shipment has already been submitted' }); return; }
  const shippedAt = new Date(input.shippedAt);
  let shipment;
  try {
    shipment = await Shipment.create({
    order: order._id,
    seller: order.seller,
    courierName: input.courierName,
    trackingId: input.trackingId,
    shippedAt,
    history: [{ actor: req.authUser!.id, courierName: input.courierName, trackingId: input.trackingId, shippedAt, recordedAt: new Date() }],
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) { res.status(409).json({ error: 'Shipment has already been submitted' }); return; }
    throw error;
  }
  await Order.updateOne({ _id: order._id, seller: req.authUser!.id }, {
    $set: { status: 'shipped' },
    $push: { statusHistory: { actor: req.authUser!.id, action: 'seller_fulfillment', fromStatus: order.status, toStatus: 'shipped', reason: `Shipment submitted via ${input.courierName}: ${input.trackingId}`, at: new Date() } },
  });
  await DeliveryVerification.findOneAndUpdate(
    { order: order._id },
    { $setOnInsert: { order: order._id, status: 'unverified', source: 'unverified', trackingReference: input.trackingId, auditHistory: [] } },
    { upsert: true, new: true },
  );
  res.status(201).json({ shipment, payoutTriggered: false });
}));

ordersRouter.post('/mine/:id/delivery-confirmation', ...BUYER, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const input = buyerDeliverySchema.parse(req.body);
  const order = await Order.findOne({ _id: id, buyer: req.authUser!.id });
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  if (order.paymentStatus !== 'paid') { res.status(409).json({ error: 'Only paid orders can be delivery confirmed' }); return; }
  if (order.status === 'cancelled' || ['refunded', 'partially_refunded'].includes(order.paymentStatus) || order.disputeStatus === 'open') {
    res.status(409).json({ error: 'Cancelled, refunded or disputed orders cannot be delivery confirmed' }); return;
  }
  const shipment = await Shipment.findOne({ order: order._id, trackingId: input.trackingReference });
  if (!shipment) { res.status(409).json({ error: 'Tracking reference does not match the submitted shipment' }); return; }
  const result = await inTransaction(async (session) => {
    const current = await Order.findOne({ _id: order._id, buyer: req.authUser!.id, paymentStatus: 'paid', status: { $nin: ['cancelled'] }, disputeStatus: { $ne: 'open' } }).session(session);
    if (!current) throw Object.assign(new Error('Order is no longer eligible for delivery confirmation'), { status: 409 });
    const currentShipment = await Shipment.findOne({ order: current._id, trackingId: input.trackingReference }).session(session);
    if (!currentShipment) throw Object.assign(new Error('Tracking reference does not match the submitted shipment'), { status: 409 });
    const existing = await BuyerDeliveryAcknowledgement.findOne({ order: current._id, buyer: req.authUser!.id }).session(session);
    if (existing) return { acknowledgement: existing, duplicate: true };
    let acknowledgement;
    try {
      [acknowledgement] = await BuyerDeliveryAcknowledgement.create([{
        order: current._id,
        buyer: req.authUser!.id,
        trackingReference: input.trackingReference,
        acknowledgedAt: new Date(),
      }], { session });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        acknowledgement = await BuyerDeliveryAcknowledgement.findOne({ order: current._id, buyer: req.authUser!.id }).session(session);
      } else throw error;
    }
    await ensurePayoutRecord(current, session);
    return { acknowledgement, duplicate: false };
  });
  res.status(200).json({ acknowledgement: result.acknowledgement, trustedDeliveryVerified: false, payoutEligible: false, ...(result.duplicate ? { duplicate: true } : {}) });
}));

ordersRouter.get('/mine/:id/shipment', ...BUYER, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const order = await Order.findOne({ _id: id, buyer: req.authUser!.id }).select('_id');
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  const [shipment, verification, acknowledgement] = await Promise.all([
    Shipment.findOne({ order: order._id }),
    DeliveryVerification.findOne({ order: order._id }),
    BuyerDeliveryAcknowledgement.findOne({ order: order._id, buyer: req.authUser!.id }),
  ]);
  res.json({ shipment: shipment ?? null, verification: verification ?? null, acknowledgement: acknowledgement ?? null, buyerAcknowledgementNotTrustedVerification: true });
}));

ordersRouter.get('/admin', ...ADMIN, asyncHandler(async (req, res) => {
  const query = pageSchema.parse(req.query); const filter = query.status ? { status: query.status } : {};
  const [orders, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).populate('buyer', 'name email').populate('seller', 'name email'), Order.countDocuments(filter)]);
  res.json({ orders, page: query.page, limit: query.limit, total });
}));
ordersRouter.get('/admin/:id', ...ADMIN, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const order = await Order.findById(id).populate('buyer', 'name email').populate('seller', 'name email');
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  res.json({ order });
}));
ordersRouter.patch('/admin/:id/status', ...ADMIN, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id); const { status, reason } = adminStatusSchema.parse(req.body);
  const order = await Order.findById(id); if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  if (order.paymentStatus !== 'paid') { res.status(409).json({ error: 'Fulfillment cannot advance before payment is verified' }); return; }
  if (!canAdvance(order.status, status)) { res.status(409).json({ error: 'Invalid order status transition' }); return; }
  const fromStatus = order.status;
  const updated = await Order.findOneAndUpdate({ _id: id, status: fromStatus }, { $set: { status }, $push: { statusHistory: { actor: req.authUser!.id, action: 'admin_oversight', fromStatus, toStatus: status, reason, at: new Date() } } }, { new: true, runValidators: true });
  if (!updated) { res.status(409).json({ error: 'Order status changed; reload and try again' }); return; }
  res.json({ order: updated });
}));

function canAdvance(from: string, to: string): boolean {
  return from === 'pending_fulfillment' && to === 'processing';
}
