import { model, Schema } from 'mongoose';

const courierWebhookEventSchema = new Schema({
  eventId: { type: String, required: true, unique: true, immutable: true, maxlength: 200 },
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, immutable: true, index: true },
  trackingId: { type: String, required: true, immutable: true, maxlength: 200 },
  deliveredAt: { type: Date, required: true, immutable: true },
  processingStatus: { type: String, enum: ['processed'], required: true, default: 'processed', immutable: true },
}, { timestamps: true, versionKey: false });

export const CourierWebhookEvent = model('CourierWebhookEvent', courierWebhookEventSchema);
