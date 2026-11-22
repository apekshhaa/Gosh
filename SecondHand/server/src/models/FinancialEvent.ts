import { model, Schema } from 'mongoose';

const financialEventSchema = new Schema({
  provider: { type: String, enum: ['cashfree'], required: true, immutable: true },
  providerEventId: { type: String, required: true, immutable: true },
  kind: { type: String, enum: ['payment_captured', 'refund_succeeded', 'settlement_confirmed', 'settlement_reversed'], required: true, immutable: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, immutable: true, index: true },
  paymentAttempt: { type: Schema.Types.ObjectId, ref: 'PaymentAttempt', required: true, immutable: true, index: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  currency: { type: String, enum: ['INR'], required: true, immutable: true },
  amountPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  sellerCommissionPaise: { type: Number, min: 0, validate: Number.isSafeInteger, immutable: true },
  buyerMarketplaceFeePaise: { type: Number, required: true, default: 0, min: 0, validate: Number.isSafeInteger, immutable: true },
  platformCommissionPaise: { type: Number, required: true, validate: Number.isSafeInteger, immutable: true },
  sellerSharePaise: { type: Number, required: true, validate: Number.isSafeInteger, immutable: true },
  providerFeePaise: { type: Number, min: 0, validate: Number.isSafeInteger, immutable: true },
  providerReference: { type: String, maxlength: 200, immutable: true },
  occurredAt: { type: Date, required: true, immutable: true },
}, { timestamps: true, versionKey: false });

financialEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });
financialEventSchema.index({ order: 1, kind: 1, occurredAt: 1 });
export const FinancialEvent = model('FinancialEvent', financialEventSchema);
