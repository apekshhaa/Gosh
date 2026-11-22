import { model, Schema } from 'mongoose';

const buyerDeliveryAcknowledgementSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, immutable: true, index: true },
  buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  trackingReference: { type: String, required: true, trim: true, maxlength: 200, immutable: true },
  acknowledgedAt: { type: Date, required: true, default: Date.now, immutable: true },
}, { timestamps: true, versionKey: false });

export const BuyerDeliveryAcknowledgement = model('BuyerDeliveryAcknowledgement', buyerDeliveryAcknowledgementSchema);
