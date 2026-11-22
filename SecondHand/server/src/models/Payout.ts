import { model, Schema } from 'mongoose';

const payoutHistorySchema = new Schema({
  status: { type: String, enum: ['eligible', 'blocked', 'initiated', 'processing', 'paid', 'failed'], required: true },
  providerReference: { type: String, trim: true, maxlength: 200 },
  failureReason: { type: String, trim: true, maxlength: 1000 },
  at: { type: Date, required: true, default: Date.now },
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const payoutSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, immutable: true, index: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  productSubtotalPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  commissionRateBps: { type: Number, required: true, min: 0, max: 10000, validate: Number.isSafeInteger, immutable: true },
  commissionAmountPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  sellerNetPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  currency: { type: String, enum: ['INR'], required: true, immutable: true, default: 'INR' },
  status: { type: String, enum: ['eligible', 'blocked', 'initiated', 'processing', 'paid', 'failed'], required: true, default: 'eligible', index: true },
  idempotencyKey: { type: String, required: true, unique: true, immutable: true },
  providerName: { type: String, enum: ['disabled', 'mock'], required: true, immutable: true },
  providerReference: { type: String, trim: true, maxlength: 200 },
  initiatedAt: { type: Date },
  completedAt: { type: Date },
  failureReason: { type: String, trim: true, maxlength: 1000 },
  history: { type: [payoutHistorySchema], required: true, default: [] },
}, { timestamps: true, versionKey: false });

payoutSchema.index({ seller: 1, status: 1, createdAt: -1 });
payoutSchema.pre('validate', function next() {
  if (this.status === 'paid' && this.providerName === 'disabled') {
    this.invalidate('status', 'Disabled payout provider cannot mark payouts paid');
  }
});
export const Payout = model('Payout', payoutSchema);
