import { model, Schema } from 'mongoose';

const shipmentHistorySchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  courierName: { type: String, required: true, trim: true, maxlength: 100 },
  trackingId: { type: String, required: true, trim: true, maxlength: 200 },
  shippedAt: { type: Date, required: true },
  recordedAt: { type: Date, required: true, default: Date.now },
}, { _id: false });

const shipmentSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true, immutable: true, index: true },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, index: true },
  courierName: { type: String, required: true, trim: true, maxlength: 100, immutable: true },
  trackingId: { type: String, required: true, trim: true, maxlength: 200, immutable: true },
  shippedAt: { type: Date, required: true, immutable: true },
  history: { type: [shipmentHistorySchema], required: true, default: [] },
}, { timestamps: true, versionKey: false });

export const Shipment = model('Shipment', shipmentSchema);
