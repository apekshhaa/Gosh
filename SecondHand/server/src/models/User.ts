import { model, Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, index: true },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, trim: true, maxlength: 30 },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer', required: true },
  emailVerified: { type: Boolean, default: false, required: true },
  phoneVerified: { type: Boolean, default: false, required: true },
  status: { type: String, enum: ['active', 'suspended', 'closed'], default: 'active', required: true },
  sessionVersion: { type: Number, default: 0, required: true, select: false },
}, { timestamps: true, versionKey: false });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model('User', userSchema);
