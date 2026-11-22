import { model, Schema } from 'mongoose';

const deliveryAuditSchema = new Schema({
  action: { type: String, enum: ['courier_webhook', 'admin_verification'], required: true },
  source: { type: String, enum: ['trusted_courier', 'admin'], required: true },
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  trackingReference: { type: String, required: true, trim: true, maxlength: 200 },
  evidence: { type: String, trim: true, maxlength: 1000 },
  at: { type: Date, required: true, default: Date.now },
}, { _id: false });

const deliveryVerificationSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, immutable: true, index: true },
  status: { type: String, enum: ['unverified', 'verified'], required: true, default: 'unverified', index: true },
  source: { type: String, enum: ['unverified', 'trusted_courier', 'admin'] },
  trackingReference: { type: String, trim: true, maxlength: 200 },
  verifiedAt: { type: Date },
  verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  evidence: { type: String, trim: true, maxlength: 1000 },
  auditHistory: { type: [deliveryAuditSchema], required: true, default: [] },
}, { timestamps: true, versionKey: false });

export const DeliveryVerification = model('DeliveryVerification', deliveryVerificationSchema);
