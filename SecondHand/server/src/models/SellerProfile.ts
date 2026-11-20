import { model, Schema } from 'mongoose';

const sellerProfileSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  legalName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  address: {
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, maxlength: 2, uppercase: true, default: 'IN' },
  },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending', required: true, index: true },
  submittedAt: { type: Date, default: Date.now, required: true },
  reviewedAt: { type: Date },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String, trim: true, maxlength: 1000 },
  agreementVersion: { type: String, required: true, trim: true, maxlength: 40 },
  agreementAcceptedAt: { type: Date, required: true },
}, { timestamps: true, versionKey: false });

export const SellerProfile = model('SellerProfile', sellerProfileSchema);
