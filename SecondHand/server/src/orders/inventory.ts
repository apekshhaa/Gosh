import mongoose, { type ClientSession, type Types } from 'mongoose';
import { Order } from '../models/Order.js';
import { PaymentAttempt } from '../models/PaymentAttempt.js';
import { Product } from '../models/Product.js';
import { FinancialEvent } from '../models/FinancialEvent.js';
import { CashfreeSandboxProvider } from '../payments/cashfreeProvider.js';
import { paymentProviderUnavailable } from '../payments/provider.js';

export class InventoryTransactionUnavailable extends Error {
  readonly status = 503;
  constructor() { super('Inventory operations require MongoDB replica-set transactions'); }
}

export async function assertReplicaSetTransactions(): Promise<void> {
  if (!mongoose.connection.db) throw new InventoryTransactionUnavailable();
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (typeof hello.setName !== 'string' || !hello.setName || !hello.logicalSessionTimeoutMinutes) throw new InventoryTransactionUnavailable();
}

export async function inTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  await assertReplicaSetTransactions();
  const session = await mongoose.startSession();
  let result!: T;
  try {
    await session.withTransaction(async () => { result = await work(session); }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, readPreference: 'primary' });
    return result;
  } finally { await session.endSession(); }
}

/** One guarded transaction is the idempotent ownership claim and all stock restoration. */
export async function releaseExpiredReservation(orderId: Types.ObjectId | string, now = new Date()): Promise<boolean> {
  return releaseReservation(orderId, 'payment_expired', now);
}

export async function cancelUnpaidReservation(orderId: Types.ObjectId | string, buyerId: string, now = new Date()): Promise<boolean> {
  return releaseReservation(orderId, 'buyer_cancelled', now, buyerId);
}

async function releaseReservation(orderId: Types.ObjectId | string, reason: 'payment_expired' | 'buyer_cancelled', now: Date, buyerId?: string): Promise<boolean> {
  return inTransaction(async (session) => {
    const filter = { _id: orderId, ...(buyerId ? { buyer: buyerId } : { reservationExpiresAt: { $lte: now } }), inventoryReleasedAt: null, paymentStatus: { $in: ['unpaid', 'pending', 'failed', 'expired'] }, status: 'pending_fulfillment' };
    const order = await Order.findOne(filter).session(session);
    if (!order) return false;

    // A pending provider payment can settle late. The recovery worker must reconcile it first.
    const unresolved = await PaymentAttempt.exists({ order: order._id, status: { $in: ['pending', 'authorized'] } }).session(session);
    if (unresolved) return false;
    const paidAttempt = await PaymentAttempt.exists({ order: order._id, status: { $in: ['paid', 'partially_refunded', 'refunded'] } }).session(session);
    if (paidAttempt) return false;

    for (const item of order.items) {
      const restored = await Product.updateOne({ _id: item.product }, { $inc: { inventory: item.quantity } }, { session });
      if (restored.matchedCount !== 1) throw new Error(`Missing product while releasing reservation for order ${order.id}`);
    }
    const released = await Order.updateOne(filter, { $set: { inventoryReleasedAt: now, reservationReleaseReason: reason, ...(reason === 'payment_expired' ? { paymentStatus: 'expired' } : {}), status: 'cancelled', cancelledAt: now } }, { session });
    if (released.modifiedCount !== 1) throw new Error(`Reservation state changed while releasing order ${order.id}`);
    await PaymentAttempt.updateMany({ order: order._id, status: { $in: ['pending', 'failed'] } }, { $set: { status: 'expired', completedAt: now } }, { session });
    return true;
  });
}

export async function recoverExpiredReservations(batchSize = 100, now = new Date()): Promise<{ examined: number; released: number; awaitingProvider: number }> {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000) throw new RangeError('Invalid inventory recovery batch size');
  await assertReplicaSetTransactions();
  const candidates = await Order.find({ reservationExpiresAt: { $lte: now }, inventoryReleasedAt: null, paymentStatus: { $in: ['unpaid', 'pending', 'failed', 'expired'] }, status: 'pending_fulfillment' }).select('_id').sort({ reservationExpiresAt: 1 }).limit(batchSize).lean();
  let released = 0;
  let awaitingProvider = 0;
  for (const candidate of candidates) {
    const attempts = await PaymentAttempt.find({ order: candidate._id, status: { $in: ['pending', 'authorized'] } });
    if (attempts.length) {
      if (paymentProviderUnavailable()) { awaitingProvider += 1; continue; }
      try {
        const providerOrder = await new CashfreeSandboxProvider().fetchOrder(attempts[0]!.providerOrderId);
        const order = await Order.findById(candidate._id);
        if (!order || providerOrder.amountPaise !== order.totalPaise || providerOrder.currency !== 'INR' || attempts.some((attempt) => attempt.amountPaise !== providerOrder.amountPaise)) { awaitingProvider += 1; continue; }
        const successfulPayment = providerOrder.payments.find((payment) => payment.status === 'paid');
        if (successfulPayment) {
          if (successfulPayment.amountPaise !== order.totalPaise) { awaitingProvider += 1; continue; }
          await confirmProviderPayment(order.id, attempts[0]!.id, successfulPayment, now);
          continue;
        }
        const unresolvedProviderPayment = providerOrder.payments.some((payment) => payment.status === 'pending' || payment.status === 'authorized');
        if (unresolvedProviderPayment || !['EXPIRED', 'TERMINATED'].includes(providerOrder.status)) { awaitingProvider += 1; continue; }
        await inTransaction(async (session) => {
          await PaymentAttempt.updateMany({ order: order._id, status: { $in: ['pending', 'authorized'] } }, { $set: { status: 'failed', completedAt: now } }, { session });
          await Order.updateOne({ _id: order._id, paymentStatus: { $in: ['unpaid', 'pending', 'failed'] }, inventoryReleasedAt: null }, { $set: { paymentStatus: 'failed' } }, { session });
        });
      } catch {
        awaitingProvider += 1;
        continue;
      }
    }
    if (await releaseExpiredReservation(candidate._id, now)) released += 1;
  }
  return { examined: candidates.length, released, awaitingProvider };
}

async function confirmProviderPayment(orderId: string, attemptId: string, payment: { providerPaymentId: string; amountPaise: number; status: string; occurredAt?: Date }, now: Date): Promise<void> {
  await inTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    const attempt = await PaymentAttempt.findById(attemptId).session(session);
    if (!order || !attempt || payment.amountPaise !== order.totalPaise || payment.amountPaise !== attempt.amountPaise) throw new Error('Provider payment no longer matches the local order');
    if (attempt.status === 'refunded' || attempt.status === 'partially_refunded') return;
    await PaymentAttempt.updateOne({ _id: attempt._id, status: { $nin: ['refunded', 'partially_refunded'] } }, { $set: { status: 'paid', providerPaymentId: payment.providerPaymentId, completedAt: now } }, { session });
    await Order.updateOne({ _id: order._id, paymentStatus: { $nin: ['refunded', 'partially_refunded'] } }, { $set: { paymentStatus: 'paid' } }, { session });
    const eventId = `cashfree-payment:${payment.providerPaymentId}`;
    if (!await FinancialEvent.exists({ provider: 'cashfree', providerEventId: eventId }).session(session)) {
      await FinancialEvent.create([{ provider: 'cashfree', providerEventId: eventId, kind: 'payment_captured', order: order._id, paymentAttempt: attempt._id, seller: order.seller, currency: 'INR', amountPaise: payment.amountPaise, sellerCommissionPaise: order.sellerCommissionPaise ?? order.platformCommissionPaise, buyerMarketplaceFeePaise: order.buyerMarketplaceFeePaise ?? 0, platformCommissionPaise: order.platformCommissionPaise, sellerSharePaise: order.sellerSharePaise, providerReference: payment.providerPaymentId, occurredAt: payment.occurredAt && !Number.isNaN(payment.occurredAt.getTime()) ? payment.occurredAt : now }], { session });
    }
  });
}
