import { model, Schema } from 'mongoose';

const paymentEventSchema = new Schema({
  provider: { type: String, enum: ['cashfree'], required: true, immutable: true },
  providerEventId: { type: String, required: true, immutable: true },
  attempt: { type: Schema.Types.ObjectId, ref: 'PaymentAttempt', required: true, immutable: true, index: true },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, immutable: true, index: true },
  kind: { type: String, enum: ['payment_pending', 'payment_authorized', 'payment_succeeded', 'payment_failed', 'refund', 'settlement'], required: true, immutable: true },
  amountPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  providerReference: { type: String, maxlength: 200, immutable: true },
  processingStatus: { type: String, enum: ['received', 'processed'], default: 'received', required: true },
  processedAt: { type: Date },
}, { timestamps: true, versionKey: false });
paymentEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });
export const PaymentEvent = model('PaymentEvent', paymentEventSchema);
