import { Router } from 'express';
import { Product } from '../models/Product.js';
import { requireAuth, requireApprovedSeller, requireRole } from '../middleware/auth.js';
import { requireProductOwner } from '../middleware/ownership.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { SellerProfile } from '../models/SellerProfile.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { z } from 'zod';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';

export const sellerRouter = Router();
const productInput = z.object({
  title: z.string().trim().min(2).max(160), description: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(1).max(80), subcategory: z.string().trim().min(1).max(80), brand: z.string().trim().max(100).optional(),
  size: z.string().trim().min(1).max(30), condition: z.enum(['pristine', 'excellent', 'very_good', 'good']),
  pricePaise: z.number().int().safe().min(1),
  imageUrls: z.array(z.string().regex(/^\/api\/v1\/uploads\/[a-f\d]{24}\/[a-f0-9-]{36}\.(?:jpg|png|webp)$/i)).max(10).default([]),
  inventory: z.number().int().safe().min(1).default(1),
}).strict();
const productPatch = productInput.partial().strict();
const productIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id');
const listingQuerySchema = z.object({ status: z.enum(['draft', 'pending_review', 'approved', 'rejected', 'sold', 'removed']).optional(), page: z.coerce.number().int().min(1).max(100000).default(1), limit: z.coerce.number().int().min(1).max(100).default(25) });
const imageInput = z.object({ image: z.string().max(7_000_000) }).strict();
const listingLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false, skip: () => env.NODE_ENV === 'test', message: { error: 'Too many listing changes. Please try again later.' } });
const addressSchema = z.object({
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()).default('IN'),
}).strict();
const applicationSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  legalName: z.string().trim().min(2).max(120),
  address: addressSchema,
  agreementAccepted: z.literal(true),
}).strict();

sellerRouter.post('/apply', requireAuth, asyncHandler(async (req, res) => {
  if (req.authUser!.role !== 'buyer') {
    res.status(409).json({ error: 'Only buyer accounts can apply to become a seller' });
    return;
  }
  const input = applicationSchema.parse(req.body);
  const user = await User.findById(req.authUser!.id).select('_id role status');
  if (!user || user.status !== 'active' || user.role !== 'buyer') {
    res.status(409).json({ error: 'This account cannot submit a seller application' });
    return;
  }
  const application = {
    displayName: input.displayName,
    legalName: input.legalName,
    address: input.address,
    agreementVersion: env.SELLER_AGREEMENT_VERSION,
    agreementAcceptedAt: new Date(),
    submittedAt: new Date(),
    status: 'pending' as const,
  };
  const previous = await SellerProfile.findOne({ user: user._id }).select('_id status');
  if (previous && previous.status !== 'rejected') {
    res.status(409).json({ error: 'An active seller application already exists' });
    return;
  }
  if (previous) {
    const reapplied = await SellerProfile.findOneAndUpdate(
      { _id: previous._id, user: user._id, status: 'rejected' },
      { $set: application, $unset: { reviewedAt: 1, reviewedBy: 1, rejectionReason: 1 } },
      { new: true, runValidators: true },
    );
    if (!reapplied) {
      res.status(409).json({ error: 'The seller application status changed; refresh and try again' });
      return;
    }
    res.status(201).json({ application: reapplied });
    return;
  }
  const created = await SellerProfile.create({ user: user._id, ...application });
  res.status(201).json({ application: created });
}));

sellerRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const application = await SellerProfile.findOne({ user: req.authUser!.id }).select('-__v');
  if (!application) { res.status(404).json({ error: 'Seller application not found' }); return; }
  res.json({ application });
}));

const approvedSeller = [requireAuth, requireRole('seller'), requireApprovedSeller];

sellerRouter.get('/products', ...approvedSeller, asyncHandler(async (req, res) => {
  const query = listingQuerySchema.parse(req.query);
  const filter = { seller: req.authUser!.id, ...(query.status ? { status: query.status } : {}) };
  const [products, total] = await Promise.all([Product.find(filter).sort({ updatedAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit), Product.countDocuments(filter)]);
  res.json({ products, page: query.page, limit: query.limit, total });
}));

sellerRouter.post('/products/images', ...approvedSeller, listingLimiter, asyncHandler(async (req, res) => {
  if (env.NODE_ENV === 'production') { res.status(503).json({ error: 'Local image storage is development-only; configure an image storage provider' }); return; }
  const { image } = imageInput.parse(req.body);
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
  if (!match) { res.status(400).json({ error: 'Image must be a JPEG, PNG, or WebP data URL' }); return; }
  const bytes = Buffer.from(match[2]!, 'base64');
  if (bytes.length < 16 || bytes.length > 5 * 1024 * 1024) { res.status(400).json({ error: 'Image must be between 16 bytes and 5 MB' }); return; }
  const type = detectImageType(bytes);
  if (type !== match[1]) { res.status(400).json({ error: 'Image content does not match its declared type' }); return; }
  const extension = type === 'image/jpeg' ? 'jpg' : type === 'image/png' ? 'png' : 'webp';
  const filename = `${crypto.randomUUID()}.${extension}`;
  const directory = path.resolve(process.cwd(), 'uploads', req.authUser!.id);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), bytes, { flag: 'wx' });
  res.status(201).json({ imageUrl: `/api/v1/uploads/${req.authUser!.id}/${filename}` });
}));

sellerRouter.post('/products', ...approvedSeller, listingLimiter, asyncHandler(async (req, res) => {
  const input = productInput.parse(req.body);
  const imageError = validateOwnedImages(input.imageUrls, req.authUser!.id);
  if (imageError) { res.status(imageError.status).json({ error: imageError.message }); return; }
  const product = await Product.create({ ...input, seller: req.authUser!.id, status: 'pending_review' });
  res.status(201).json({ product });
}));

sellerRouter.patch('/products/:id', ...approvedSeller, listingLimiter, requireProductOwner, asyncHandler(async (req, res) => {
  const id = productIdSchema.parse(req.params.id);
  const input = productPatch.parse(req.body);
  if (input.imageUrls) {
    const imageError = validateOwnedImages(input.imageUrls, req.authUser!.id);
    if (imageError) { res.status(imageError.status).json({ error: imageError.message }); return; }
  }
  if (!Object.keys(input).length) { res.status(400).json({ error: 'At least one product field is required' }); return; }
  const current = await Product.findOne({ _id: id, seller: req.authUser!.id });
  if (!current) { res.status(404).json({ error: 'Product not found' }); return; }
  if (['sold', 'removed'].includes(current.status)) { res.status(409).json({ error: 'This listing can no longer be edited' }); return; }
  Object.assign(current, input);
  current.status = 'pending_review';
  current.reviewedBy = undefined;
  current.reviewedAt = undefined;
  current.rejectionReason = undefined;
  current.moderationReason = undefined;
  await current.save();
  res.json({ product: current });
}));

sellerRouter.delete('/products/:id', ...approvedSeller, listingLimiter, requireProductOwner, asyncHandler(async (req, res) => {
  const id = productIdSchema.parse(req.params.id);
  const product = await Product.findOne({ _id: id, seller: req.authUser!.id });
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  if (product.status !== 'sold') { product.status = 'removed'; await product.save(); }
  res.status(204).end();
}));

sellerRouter.get('/products/:id', ...approvedSeller, requireProductOwner, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  res.json({ product });
}));

function detectImageType(bytes: Buffer): string | undefined {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return undefined;
}

function validateOwnedImages(imageUrls: string[], userId: string): { status: 400 | 503; message: string } | null {
  if (env.NODE_ENV === 'production' && imageUrls.length) return { status: 503, message: 'Local image storage is unavailable in production until a provider is configured' };
  if (imageUrls.some((url) => !url.startsWith(`/api/v1/uploads/${userId}/`))) return { status: 400, message: 'Product images must be uploaded by the current seller' };
  return null;
}
