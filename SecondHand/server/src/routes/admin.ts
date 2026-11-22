import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { SellerProfile } from '../models/SellerProfile.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { FinancialEvent } from '../models/FinancialEvent.js';
import { Order } from '../models/Order.js';
import { PaymentAttempt } from '../models/PaymentAttempt.js';
import { SELLER_COMMISSION_BPS, SELLER_SHARE_BPS, BUYER_MARKETPLACE_FEE_BPS } from '../payments/commission.js';
import { Shipment } from '../models/Shipment.js';
import { DeliveryVerification } from '../models/DeliveryVerification.js';
import { Payout } from '../models/Payout.js';
import { ensurePayoutRecord, disabledPayoutResult } from '../payouts/ledger.js';
import { PayoutAdjustment } from '../models/PayoutAdjustment.js';
import { inTransaction } from '../orders/inventory.js';
import { BuyerDeliveryAcknowledgement } from '../models/BuyerDeliveryAcknowledgement.js';

export const adminRouter = Router();
const adminOnly = [requireAuth, requireRole('admin')];
const adminActionLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false, skip: () => process.env.NODE_ENV === 'test', message: { error: 'Too many admin actions. Please try again later.' } });
const idSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid seller application id');
const listSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});
const rejectionSchema = z.object({ reason: z.string().trim().min(5).max(1000) }).strict();
const emptyBodySchema = z.object({}).strict();
const productListSchema = z.object({ status: z.enum(['pending_review', 'approved', 'rejected']).default('pending_review'), page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });
const moderationReasonSchema = z.object({ reason: z.string().trim().min(5).max(1000) }).strict();
const reconciliationSchema = z.object({ from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });
const userListSchema = z.object({ role: z.enum(['buyer', 'seller', 'admin']).optional(), status: z.enum(['active', 'suspended', 'closed']).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });
const suspensionSchema = z.object({ reason: z.string().trim().min(5).max(1000) }).strict();
const deliveryVerifySchema = z.object({ trackingReference: z.string().trim().min(3).max(200), evidence: z.string().trim().min(5).max(1000), reason: z.string().trim().min(5).max(1000) }).strict();
const disputeSchema = z.object({ status: z.enum(['open', 'resolved']), reason: z.string().trim().min(5).max(1000) }).strict();
const refundSchema = z.object({ kind: z.enum(['refund', 'partial_refund']), refundAmountPaise: z.number().int().safe().min(0).max(1_000_000_000), reason: z.string().trim().min(5).max(1000) }).strict();

adminRouter.get('/overview', ...adminOnly, asyncHandler(async (_req, res) => {
  const [users, sellers, products, orders, pendingApplications, pendingProducts, unpaidOrders, paymentAttempts, finance] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: 'seller' }), Product.countDocuments(), Order.countDocuments(),
    SellerProfile.countDocuments({ status: 'pending' }), Product.countDocuments({ status: 'pending_review' }),
    Order.countDocuments({ paymentStatus: { $ne: 'paid' }, status: { $ne: 'cancelled' } }), PaymentAttempt.countDocuments(),
    FinancialEvent.aggregate([{ $group: { _id: null, capturedPaise: { $sum: { $cond: [{ $eq: ['$kind', 'payment_captured'] }, '$amountPaise', 0] } }, platformCommissionPaise: { $sum: '$platformCommissionPaise' }, sellerSharePaise: { $sum: '$sellerSharePaise' } } }]),
  ]);
  const totals = finance[0] || { capturedPaise: 0, platformCommissionPaise: 0, sellerSharePaise: 0 };
  res.json({ counts: { users, sellers, products, orders, pendingApplications, pendingProducts, unpaidOrders, paymentAttempts }, finance: { capturedPaise: totals.capturedPaise, platformCommissionPaise: totals.platformCommissionPaise, sellerCommissionPaise: totals.platformCommissionPaise, sellerSharePaise: totals.sellerSharePaise, commissionRateBps: SELLER_COMMISSION_BPS, sellerShareRateBps: SELLER_SHARE_BPS, buyerMarketplaceFeePaise: BUYER_MARKETPLACE_FEE_BPS }, paymentProvider: 'disabled' });
}));

adminRouter.get('/settlement/overview', ...adminOnly, asyncHandler(async (_req, res) => {
  const [awaitingShipment, awaitingDelivery, verified, eligible, pending, processing, paid, failed, disputed, refunded] = await Promise.all([
    Order.countDocuments({ paymentStatus: 'paid', status: { $in: ['pending_fulfillment', 'processing'] } }),
    Order.countDocuments({ paymentStatus: 'paid', status: 'shipped' }),
    DeliveryVerification.countDocuments({ status: 'verified' }),
    Payout.countDocuments({ status: 'eligible' }),
    Payout.countDocuments({ status: { $in: ['eligible', 'blocked'] } }),
    Payout.countDocuments({ status: 'processing' }),
    Payout.countDocuments({ status: 'paid' }),
    Payout.countDocuments({ status: 'failed' }),
    Order.countDocuments({ disputeStatus: 'open' }),
    Order.countDocuments({ paymentStatus: { $in: ['refunded', 'partially_refunded'] } }),
  ]);
  res.json({ counts: { awaitingShipment, awaitingDelivery, verified, eligible, pending, processing, paid, failed, disputed, refunded }, payoutProvider: 'disabled' });
}));

adminRouter.get('/payouts', ...adminOnly, asyncHandler(async (req, res) => {
  const query = reconciliationSchema.pick({ page: true, limit: true }).parse(req.query);
  const [payouts, total] = await Promise.all([
    Payout.find().sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).populate('order', 'orderNumber status paymentStatus disputeStatus').populate('seller', 'name email'),
    Payout.countDocuments(),
  ]);
  res.json({ payouts, page: query.page, limit: query.limit, total, provider: 'disabled' });
}));

adminRouter.get('/orders/:id/delivery', ...adminOnly, asyncHandler(async (req, res) => {
  const id = z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);
  const [order, shipment, verification, acknowledgement, payout] = await Promise.all([
    Order.findById(id).populate('buyer', 'name email').populate('seller', 'name email'),
    Shipment.findOne({ order: id }),
    DeliveryVerification.findOne({ order: id }),
    BuyerDeliveryAcknowledgement.findOne({ order: id }),
    Payout.findOne({ order: id }),
  ]);
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  res.json({ order, shipment: shipment ?? null, trustedVerification: verification ?? null, buyerAcknowledgement: acknowledgement ?? null, payout: payout ?? null, buyerAcknowledgementNotTrustedVerification: true });
}));

adminRouter.post('/orders/:id/delivery/verify', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);
  const input = deliveryVerifySchema.parse(req.body);
  const result = await inTransaction(async (session) => {
    const order = await Order.findById(id).session(session);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (order.paymentStatus !== 'paid') throw Object.assign(new Error('Only paid orders can be delivery verified'), { status: 409 });
    const shipment = await Shipment.findOne({ order: order._id, trackingId: input.trackingReference }).session(session);
    if (!shipment) throw Object.assign(new Error('Tracking reference does not match the submitted shipment'), { status: 409 });
    if (order.status === 'cancelled' || ['refunded', 'partially_refunded'].includes(order.paymentStatus) || order.disputeStatus === 'open') {
      throw Object.assign(new Error('Cancelled, refunded or disputed orders cannot be delivery verified'), { status: 409 });
    }
    const verification = await DeliveryVerification.findOneAndUpdate(
      { order: order._id },
      { $set: { status: 'verified', source: 'admin', trackingReference: input.trackingReference, verifiedAt: new Date(), verifiedBy: req.authUser!.id, evidence: input.evidence }, $push: { auditHistory: { action: 'admin_verification', source: 'admin', actor: req.authUser!.id, trackingReference: input.trackingReference, evidence: input.evidence, at: new Date() } } },
      { new: true, upsert: true, runValidators: true, session },
    );
    await Order.updateOne({ _id: order._id, paymentStatus: 'paid', status: { $ne: 'cancelled' }, disputeStatus: { $ne: 'open' } }, {
      $set: { status: 'delivered' },
      $push: { statusHistory: { actor: req.authUser!.id, action: 'admin_oversight', fromStatus: order.status, toStatus: 'delivered', reason: input.reason, at: new Date() } },
    }, { session });
    const payout = await ensurePayoutRecord(order, session);
    return { verification, payout };
  });
  res.json({ verification: result.verification, payout: result.payout, payoutTriggered: false });
}));

adminRouter.post('/orders/:id/dispute', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);
  const input = disputeSchema.parse(req.body);
  const order = await Order.findById(id);
  if (!order) { res.status(404).json({ error: 'Order not found' }); return; }
  await Order.updateOne({ _id: order._id }, {
    $set: { disputeStatus: input.status },
    $push: { statusHistory: { actor: req.authUser!.id, action: 'admin_oversight', fromStatus: order.status, toStatus: order.status, reason: input.reason, at: new Date() } },
  });
  const updated = await Order.findById(id);
  if (updated) await ensurePayoutRecord(updated);
  res.json({ order: updated });
}));

adminRouter.post('/orders/:id/refund-accounting', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);
  const input = refundSchema.parse(req.body);
  const result = await inTransaction(async (session) => {
    const order = await Order.findById(id).session(session);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    if (input.refundAmountPaise > order.totalPaise) throw Object.assign(new Error('Refund amount exceeds the paid order total'), { status: 409 });
    await Order.updateOne(
      { _id: order._id, status: { $ne: 'cancelled' } },
      { $set: { paymentStatus: input.kind === 'partial_refund' ? 'partially_refunded' : 'refunded' } },
      { session },
    );
    const updated = await Order.findById(order._id).session(session);
    await ensurePayoutRecord(updated ?? order, session);
    const payout = await Payout.findOne({ order: order._id }).session(session);
    let adjustment = null;
    if (payout?.status === 'paid') {
      const key = `refund-adjustment-${String(order._id)}-${input.kind}-${input.refundAmountPaise}`;
      const recoveryNumerator = BigInt(input.refundAmountPaise) * BigInt(payout.sellerNetPaise);
      const recoveryDenominator = BigInt(order.totalPaise);
      const recoveryObligationPaise = recoveryDenominator > 0n
        ? Number((recoveryNumerator + recoveryDenominator / 2n) / recoveryDenominator)
        : 0;
      try {
        [adjustment] = await PayoutAdjustment.create([{
          order: order._id,
          payout: payout._id,
          seller: order.seller,
          refundAmountPaise: input.refundAmountPaise,
          originalSellerNetPaise: payout.sellerNetPaise,
          recoveryObligationPaise,
          idempotencyKey: key,
          reason: input.reason,
          recordedBy: req.authUser!.id,
        }], { session });
      } catch (error) {
        if ((error as { code?: number }).code === 11000) adjustment = await PayoutAdjustment.findOne({ idempotencyKey: `refund-adjustment-${String(order._id)}-${input.kind}-${input.refundAmountPaise}` }).session(session);
        else throw error;
      }
    }
    return { order: updated, payout, adjustment };
  });
  res.json({ order: result.order, payout: result.payout, adjustment: result.adjustment, provider: 'disabled', note: 'Accounting-only refund record; no provider refund or payout recovery was executed.' });
}));

adminRouter.post('/payouts/:id/retry', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  emptyBodySchema.parse(req.body ?? {});
  const id = z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);
  const payout = await Payout.findById(id);
  if (!payout) { res.status(404).json({ error: 'Payout not found' }); return; }
  if (payout.status !== 'failed') { res.status(409).json({ error: 'Only failed payouts may be retried safely' }); return; }
  const order = await Order.findById(payout.order);
  if (!order) { res.status(409).json({ error: 'Payout order is unavailable' }); return; }
  await ensurePayoutRecord(order);
  const safePayout = await Payout.findById(payout.id);
  if (!safePayout || safePayout.status !== 'failed') { res.status(409).json({ error: 'Payout is no longer retryable because eligibility or refund status changed' }); return; }
  const result = await disabledPayoutResult(payout.id);
  res.status(503).json({ payout: result?.payout ?? payout, error: 'Payout execution is disabled; no retry was initiated', provider: 'disabled' });
}));

adminRouter.get('/users', ...adminOnly, asyncHandler(async (req, res) => {
  const query = userListSchema.parse(req.query);
  const filter = { ...(query.role ? { role: query.role } : {}), ...(query.status ? { status: query.status } : {}) };
  const [users, total] = await Promise.all([
    User.find(filter).select('_id name email phone role status emailVerified phoneVerified createdAt').sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    User.countDocuments(filter),
  ]);
  res.json({ users, page: query.page, limit: query.limit, total });
}));

adminRouter.get('/payments', ...adminOnly, asyncHandler(async (req, res) => {
  const query = reconciliationSchema.pick({ page: true, limit: true }).parse(req.query);
  const [attempts, total] = await Promise.all([
    PaymentAttempt.find().select('_id order buyer provider amountPaise currency status expiresAt completedAt createdAt').sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).populate('buyer', 'name email').lean(),
    PaymentAttempt.countDocuments(),
  ]);
  res.json({ attempts, page: query.page, limit: query.limit, total, provider: 'cashfree', enabled: false });
}));

adminRouter.get('/finance/reconciliation', ...adminOnly, asyncHandler(async (req, res) => {
  const query = reconciliationSchema.parse(req.query);
  const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = query.to ? new Date(query.to) : new Date();
  if (from > to) { res.status(400).json({ error: '`from` must be before `to`' }); return; }
  const match = { occurredAt: { $gte: from, $lte: to } };
  const [events, total, groups] = await Promise.all([
    FinancialEvent.find(match).sort({ occurredAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit),
    FinancialEvent.countDocuments(match),
    FinancialEvent.aggregate([{ $match: match }, { $group: { _id: '$kind', count: { $sum: 1 }, amountPaise: { $sum: '$amountPaise' }, sellerCommissionPaise: { $sum: { $ifNull: ['$sellerCommissionPaise', '$platformCommissionPaise'] } }, buyerMarketplaceFeePaise: { $sum: '$buyerMarketplaceFeePaise' }, platformCommissionPaise: { $sum: '$platformCommissionPaise' }, sellerSharePaise: { $sum: '$sellerSharePaise' } } }, { $sort: { _id: 1 } }]),
  ]);
  res.json({ from, to, page: query.page, limit: query.limit, total, events, totalsByKind: groups, note: 'Settlement totals include only provider-confirmed settlement events; this application does not yet ingest Cashfree Easy Split settlements.' });
}));

adminRouter.get('/sellers', ...adminOnly, asyncHandler(async (req, res) => {
  const query = listSchema.parse(req.query);
  const filter = query.status ? { status: query.status } : {};
  const [applications, total] = await Promise.all([
    SellerProfile.find(filter)
      .sort({ submittedAt: -1, _id: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate('user', 'name email phone role'),
    SellerProfile.countDocuments(filter),
  ]);
  res.json({ applications, page: query.page, limit: query.limit, total });
}));

adminRouter.post('/sellers/:id/approve', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  emptyBodySchema.parse(req.body ?? {});
  let application = await SellerProfile.findById(id);
  if (!application) { res.status(404).json({ error: 'Seller application not found' }); return; }
  if (application.status !== 'pending' && application.status !== 'approved') {
    res.status(409).json({ error: 'Only pending seller applications can be approved' });
    return;
  }
  const applicant = await User.findById(application.user).select('_id role status');
  if (!applicant || applicant.status !== 'active' || !['buyer', 'seller'].includes(applicant.role)) {
    res.status(409).json({ error: 'Applicant account cannot be approved' });
    return;
  }

  if (application.status === 'pending') {
    const reviewedAt = new Date();
    const approved = await SellerProfile.findOneAndUpdate(
      { _id: application._id, status: 'pending' },
      { $set: { status: 'approved', reviewedAt, reviewedBy: req.authUser!.id }, $unset: { rejectionReason: 1 } },
      { new: true, runValidators: true },
    );
    if (!approved) { res.status(409).json({ error: 'Application status changed; refresh and try again' }); return; }
    application = approved;
  }

  if (applicant.role === 'buyer') {
    const promoted = await User.updateOne({ _id: applicant._id, role: 'buyer', status: 'active' }, { $set: { role: 'seller' } });
    if (promoted.modifiedCount !== 1) {
      const currentUser = await User.findById(applicant._id).select('_id role status');
      if (!currentUser || currentUser.role !== 'seller' || currentUser.status !== 'active') {
        if (application.status === 'approved' && application.reviewedBy?.toString() === req.authUser!.id) {
          await SellerProfile.updateOne({ _id: application._id, status: 'approved', reviewedBy: req.authUser!.id }, { $set: { status: 'pending' }, $unset: { reviewedAt: 1, reviewedBy: 1 } });
        }
        res.status(409).json({ error: 'Applicant account changed; approval could not be completed' });
        return;
      }
    }
  }
  res.json({ application });
}));

adminRouter.post('/sellers/:id/reject', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const { reason } = rejectionSchema.parse(req.body);
  const rejected = await SellerProfile.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { $set: { status: 'rejected', rejectionReason: reason, reviewedAt: new Date(), reviewedBy: req.authUser!.id } },
    { new: true, runValidators: true },
  );
  if (!rejected) {
    const exists = await SellerProfile.exists({ _id: id });
    res.status(exists ? 409 : 404).json({ error: exists ? 'Only pending seller applications can be rejected' : 'Seller application not found' });
    return;
  }
  await User.updateOne({ _id: rejected.user, role: 'seller' }, { $set: { role: 'buyer' } });
  res.json({ application: rejected });
}));

adminRouter.post('/sellers/:id/suspend', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const { reason } = suspensionSchema.parse(req.body);
  const application = await SellerProfile.findOneAndUpdate({ _id: id, status: 'approved' }, { $set: { status: 'suspended', rejectionReason: reason, reviewedAt: new Date(), reviewedBy: req.authUser!.id } }, { new: true, runValidators: true });
  if (!application) { res.status(409).json({ error: 'Only an approved seller can be suspended' }); return; }
  await User.updateOne({ _id: application.user, role: 'seller' }, { $set: { status: 'suspended' }, $inc: { sessionVersion: 1 } });
  res.json({ application });
}));

adminRouter.post('/sellers/:id/reinstate', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const application = await SellerProfile.findOneAndUpdate({ _id: id, status: 'suspended' }, { $set: { status: 'approved', reviewedAt: new Date(), reviewedBy: req.authUser!.id }, $unset: { rejectionReason: 1 } }, { new: true, runValidators: true });
  if (!application) { res.status(409).json({ error: 'Only a suspended seller can be reinstated' }); return; }
  await User.updateOne({ _id: application.user, role: 'seller', status: 'suspended' }, { $set: { status: 'active' }, $inc: { sessionVersion: 1 } });
  res.json({ application });
}));

adminRouter.get('/products', ...adminOnly, asyncHandler(async (req, res) => {
  const query = productListSchema.parse(req.query);
  const filter = { status: query.status };
  const [products, total] = await Promise.all([Product.find(filter).sort({ createdAt: 1, _id: 1 }).skip((query.page - 1) * query.limit).limit(query.limit).populate('seller', 'name email'), Product.countDocuments(filter)]);
  res.json({ products, page: query.page, limit: query.limit, total });
}));

adminRouter.post('/products/:id/approve', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);
  const { reason } = moderationReasonSchema.parse(req.body);
  const product = await Product.findOne({ _id: id, status: 'pending_review' });
  if (!product) {
    const exists = await Product.exists({ _id: id });
    res.status(exists ? 409 : 404).json({ error: exists ? 'Only pending listings can be approved' : 'Product not found' }); return;
  }
  if (product.seller.toString() === req.authUser!.id) { res.status(403).json({ error: 'Sellers cannot approve their own listings' }); return; }
  product.status = 'approved'; product.reviewedBy = req.authUser!.id as any; product.reviewedAt = new Date(); product.moderationReason = reason; product.rejectionReason = undefined;
  await product.save();
  res.json({ product });
}));

adminRouter.post('/products/:id/reject', ...adminOnly, adminActionLimiter, asyncHandler(async (req, res) => {
  const id = z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);
  const { reason } = rejectionSchema.parse(req.body);
  const product = await Product.findOne({ _id: id, status: 'pending_review' });
  if (!product) {
    const exists = await Product.exists({ _id: id });
    res.status(exists ? 409 : 404).json({ error: exists ? 'Only pending listings can be rejected' : 'Product not found' }); return;
  }
  if (product.seller.toString() === req.authUser!.id) { res.status(403).json({ error: 'Sellers cannot reject their own listings' }); return; }
  product.status = 'rejected'; product.reviewedBy = req.authUser!.id as any; product.reviewedAt = new Date(); product.rejectionReason = reason;
  product.moderationReason = reason;
  await product.save();
  res.json({ product });
}));
