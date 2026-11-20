import { model, Schema } from 'mongoose';

const paymentAttemptSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, immutable: true, index: true },
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  provider: { type: String, enum: ['cashfree'], required: true, immutable: true },
  idempotencyKey: { type: String, required: true, immutable: true },
  amountPaise: { type: Number, required: true, min: 1, validate: Number.isSafeInteger, immutable: true },
  currency: { type: String, enum: ['INR'], required: true, default: 'INR', immutable: true },
  providerOrderId: { type: String, required: true, unique: true, immutable: true },
  providerPaymentId: { type: String, index: true },
  paymentSessionId: { type: String, select: false },
  status: { type: String, enum: ['pending', 'authorized', 'paid', 'failed', 'expired', 'refunded', 'partially_refunded'], default: 'pending', required: true },
  failureCode: { type: String, maxlength: 120 },
  expiresAt: { type: Date, required: true, index: true },
  completedAt: { type: Date },
}, { timestamps: true, versionKey: false });
paymentAttemptSchema.index({ order: 1, idempotencyKey: 1 }, { unique: true });
export const PaymentAttempt = model('PaymentAttempt', paymentAttemptSchema);
