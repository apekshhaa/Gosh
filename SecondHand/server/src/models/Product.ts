import { model, Schema } from 'mongoose';

const productSchema = new Schema({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 160 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 5000 },
  category: { type: String, required: true, trim: true, maxlength: 80, index: true },
  subcategory: { type: String, trim: true, maxlength: 80, default: '' },
  brand: { type: String, trim: true, maxlength: 100 },
  size: { type: String, required: true, trim: true, maxlength: 30 },
  condition: { type: String, enum: ['pristine', 'excellent', 'very_good', 'good'], required: true },
  pricePaise: { type: Number, required: true, min: 1, validate: { validator: Number.isSafeInteger, message: 'pricePaise must be a safe integer' } },
  imageUrls: { type: [{ type: String, trim: true, maxlength: 2048 }], default: [], validate: { validator: (urls: string[]) => urls.length <= 10, message: 'At most 10 images are allowed' } },
  inventory: { type: Number, required: true, default: 1, min: 1, validate: { validator: Number.isSafeInteger, message: 'inventory must be a positive integer' } },
  status: { type: String, enum: ['draft', 'pending_review', 'approved', 'rejected', 'sold', 'removed'], default: 'draft', required: true, index: true },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectionReason: { type: String, trim: true, maxlength: 1000 },
  moderationReason: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true, versionKey: false });

productSchema.index({ status: 1, category: 1, createdAt: -1 });
productSchema.index({ status: 1, subcategory: 1, createdAt: -1 });
export const Product = model('Product', productSchema);
