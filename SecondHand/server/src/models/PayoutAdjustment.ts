import { model, Schema } from 'mongoose';

const payoutAdjustmentSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, immutable: true, index: true },
  payout: { type: Schema.Types.ObjectId, ref: 'Payout', required: true, immutable: true, index: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  refundAmountPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  originalSellerNetPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  recoveryObligationPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  currency: { type: String, enum: ['INR'], required: true, immutable: true, default: 'INR' },
  idempotencyKey: { type: String, required: true, unique: true, immutable: true },
  status: { type: String, enum: ['open', 'resolved'], required: true, default: 'open' },
  reason: { type: String, required: true, trim: true, maxlength: 1000, immutable: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
}, { timestamps: true, versionKey: false });

payoutAdjustmentSchema.index({ seller: 1, status: 1, createdAt: -1 });
export const PayoutAdjustment = model('PayoutAdjustment', payoutAdjustmentSchema);
