import { model, Schema } from 'mongoose';

const itemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, immutable: true },
  title: { type: String, required: true, trim: true, immutable: true },
  selectedSize: { type: String, trim: true, maxlength: 30, immutable: true },
  quantity: { type: Number, required: true, min: 1, validate: Number.isSafeInteger, immutable: true },
  unitPricePaise: { type: Number, required: true, min: 1, validate: Number.isSafeInteger, immutable: true },
  imageReference: { type: String, maxlength: 2048, immutable: true },
}, { _id: false });

const historySchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['seller_fulfillment', 'admin_oversight'], required: true },
  fromStatus: { type: String, required: true },
  toStatus: { type: String, required: true },
  reason: { type: String, trim: true, maxlength: 1000 },
  at: { type: Date, default: Date.now, required: true },
}, { _id: false });

const addressSchema = new Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120, immutable: true },
  phone: { type: String, required: true, trim: true, maxlength: 30, immutable: true },
  line1: { type: String, required: true, trim: true, maxlength: 200, immutable: true },
  line2: { type: String, trim: true, maxlength: 200, immutable: true },
  city: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
  state: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
  postalCode: { type: String, required: true, trim: true, maxlength: 20, immutable: true },
  country: { type: String, required: true, trim: true, maxlength: 2, uppercase: true, immutable: true },
}, { _id: false });

const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true, immutable: true, index: true },
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  idempotencyKey: { type: String, required: true, immutable: true },
  requestHash: { type: String, required: true, immutable: true, select: false },
  items: { type: [itemSchema], required: true, immutable: true, validate: (items: unknown[]) => items.length > 0 },
  itemSubtotalPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  shippingPaise: { type: Number, required: true, min: 0, default: 0, validate: Number.isSafeInteger, immutable: true },
  discountsPaise: { type: Number, required: true, min: 0, default: 0, validate: Number.isSafeInteger, immutable: true },
  taxesPaise: { type: Number, required: true, min: 0, default: 0, validate: Number.isSafeInteger, immutable: true },
  totalPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  commissionRateBps: { type: Number, required: true, default: 2000, min: 0, max: 10000, validate: Number.isSafeInteger, immutable: true },
  commissionBasisPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  platformCommissionPaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  sellerSharePaise: { type: Number, required: true, min: 0, validate: Number.isSafeInteger, immutable: true },
  deliveryAddress: { type: addressSchema, immutable: true },
  status: { type: String, enum: ['pending_fulfillment', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending_fulfillment', required: true, index: true },
  paymentStatus: { type: String, enum: ['unpaid', 'pending', 'authorized', 'paid', 'failed', 'expired', 'partially_refunded', 'refunded'], default: 'unpaid', required: true, index: true },
  reservationExpiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 20 * 60 * 1000), index: true },
  inventoryReleasedAt: { type: Date, default: null, index: true },
  reservationReleaseReason: { type: String, enum: ['payment_expired', 'buyer_cancelled'] },
  cancelledAt: { type: Date },
  statusHistory: { type: [historySchema], default: [] },
}, { timestamps: true, versionKey: false });

orderSchema.index({ buyer: 1, idempotencyKey: 1 }, { unique: true });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, reservationExpiresAt: 1, inventoryReleasedAt: 1 });
export const Order = model('Order', orderSchema);
