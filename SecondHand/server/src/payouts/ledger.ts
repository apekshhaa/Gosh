import crypto from 'node:crypto';
import { Payout } from '../models/Payout.js';
import { evaluatePayoutEligibility } from './eligibility.js';
import mongoose from 'mongoose';
import { inTransaction } from '../orders/inventory.js';

export type LedgerOrder = {
  _id: unknown;
  seller: unknown;
  itemSubtotalPaise: number;
  commissionRateBps: number;
  commissionBasisPaise: number;
  platformCommissionPaise: number;
  sellerCommissionPaise?: number | null;
  sellerSharePaise: number;
  status: string;
  cancelledAt?: Date | null;
  paymentStatus: string;
  disputeStatus?: string;
};

export async function ensurePayoutRecord(order: LedgerOrder, suppliedSession?: mongoose.ClientSession) {
  const run = async (session: mongoose.ClientSession) => {
    const fresh = await mongoose.model('Order').findById(order._id).session(session) as LedgerOrder & { _id: unknown };
    if (!fresh) return null;
    const existing = await Payout.findOne({ order: fresh._id }).session(session);
    if (existing?.status === 'paid') return existing;
    const eligibility = await evaluatePayoutEligibility(fresh, session);
    const commissionAmount = fresh.sellerCommissionPaise ?? fresh.platformCommissionPaise;
    const desiredStatus = eligibility.eligible ? 'eligible' : 'blocked';
    const key = `payout-${String(fresh._id)}`;
    if (existing) {
      if (existing.status === 'failed' || existing.status === 'initiated' || existing.status === 'processing') return existing;
      if (existing.status !== desiredStatus) {
        await Payout.updateOne({ _id: existing._id, status: { $nin: ['paid', 'initiated', 'processing', 'failed'] } }, {
          $set: { status: desiredStatus, failureReason: eligibility.reason ?? undefined },
          $push: { history: { status: desiredStatus, failureReason: eligibility.reason ?? undefined, at: new Date() } },
        }, { session });
      }
      return Payout.findById(existing._id).session(session);
    }
    try {
      const [created] = await Payout.create([{
        order: fresh._id,
        seller: fresh.seller,
        productSubtotalPaise: fresh.commissionBasisPaise,
        commissionRateBps: fresh.commissionRateBps,
        commissionAmountPaise: commissionAmount,
        sellerNetPaise: fresh.sellerSharePaise,
        currency: 'INR',
        status: desiredStatus,
        idempotencyKey: key,
        providerName: 'disabled',
        failureReason: eligibility.reason ?? undefined,
        history: [{ status: desiredStatus, failureReason: eligibility.reason ?? undefined, at: new Date() }],
      }], { session });
      return created;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return Payout.findOne({ order: fresh._id }).session(session);
      throw error;
    }
  };
  if (suppliedSession) return run(suppliedSession);
  return inTransaction(run);
}

export async function disabledPayoutResult(payoutId: string) {
  const payout = await Payout.findById(payoutId);
  if (!payout) return null;
  if (payout.status === 'paid') return { disabled: true, payout, message: 'Completed payouts cannot be changed.' };
  if (!['eligible', 'failed'].includes(payout.status)) return { disabled: true, payout, message: 'Payout is not eligible for initiation.' };
  return { disabled: true, payout, message: 'Payout execution is disabled; no money was transferred.' };
}

export function newPayoutIdempotencyKey(orderId: string) {
  return `payout-${orderId}-${crypto.createHash('sha256').update(orderId).digest('hex').slice(0, 12)}`;
}
