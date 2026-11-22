import { DeliveryVerification } from '../models/DeliveryVerification.js';
import { Shipment } from '../models/Shipment.js';
import type mongoose from 'mongoose';
export type PayoutEligibility = { eligible: boolean; reason: string | null };

export async function evaluatePayoutEligibility(order: {
  _id: unknown;
  seller: unknown;
  status: string;
  cancelledAt?: Date | null;
  paymentStatus: string;
  disputeStatus?: string;
  commissionBasisPaise: number;
  sellerSharePaise: number;
  platformCommissionPaise: number;
  commissionRateBps: number;
}, session?: mongoose.ClientSession): Promise<PayoutEligibility> {
  if (order.status === 'cancelled' || order.cancelledAt) return { eligible: false, reason: 'cancelled' };
  if (['refunded', 'partially_refunded'].includes(order.paymentStatus)) return { eligible: false, reason: 'refunded' };
  if (order.disputeStatus === 'open') return { eligible: false, reason: 'disputed' };
  if (order.paymentStatus !== 'paid') return { eligible: false, reason: 'payment_not_confirmed' };
  const shipmentQuery = Shipment.exists({ order: order._id, seller: order.seller });
  const shipment = session ? await shipmentQuery.session(session) : await shipmentQuery;
  if (!shipment) return { eligible: false, reason: 'shipment_not_submitted' };
  const deliveryQuery = DeliveryVerification.findOne({ order: order._id }).lean();
  const delivery = session ? await deliveryQuery.session(session) : await deliveryQuery;
  if (!delivery || delivery.status !== 'verified' || typeof delivery.source !== 'string' || !['trusted_courier', 'admin'].includes(delivery.source)) {
    return { eligible: false, reason: 'delivery_not_verified' };
  }
  if (!Number.isSafeInteger(order.commissionBasisPaise) || order.commissionBasisPaise < 0 ||
      !Number.isSafeInteger(order.sellerSharePaise) || order.sellerSharePaise < 0 ||
      !Number.isSafeInteger(order.platformCommissionPaise) || order.platformCommissionPaise < 0 ||
      !Number.isSafeInteger(order.commissionRateBps)) {
    return { eligible: false, reason: 'invalid_seller_snapshot' };
  }
  return { eligible: true, reason: null };
}
