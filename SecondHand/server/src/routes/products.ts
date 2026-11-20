import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { SellerProfile } from '../models/SellerProfile.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const productsRouter = Router();
const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  subcategory: z.string().trim().min(1).max(80).optional(),
  size: z.string().trim().min(1).max(30).optional(),
  condition: z.enum(['pristine', 'excellent', 'very_good', 'good']).optional(),
  minPricePaise: z.coerce.number().int().min(0).optional(),
  maxPricePaise: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export function publicProduct(product: any, sellerName?: string) {
  return {
    id: String(product._id), title: product.title, description: product.description,
    category: product.category, subcategory: product.subcategory || product.category, brand: product.brand || sellerName || 'GOSH Seller', size: product.size,
    condition: product.condition, pricePaise: product.pricePaise, imageUrls: product.imageUrls || [],
    inventory: product.inventory, seller: String(product.seller), sellerDisplayName: sellerName,
    createdAt: product.createdAt,
  };
}

productsRouter.get('/', asyncHandler(async (req, res) => {
  const query = listSchema.parse(req.query);
  if (query.minPricePaise !== undefined && query.maxPricePaise !== undefined && query.minPricePaise > query.maxPricePaise) {
    res.status(400).json({ error: 'Minimum price must not exceed maximum price' }); return;
  }
  const filter: Record<string, unknown> = { status: 'approved', inventory: { $gt: 0 } };
  const alternatives: Array<Record<string, unknown>> = [];
  if (query.category) { const categoryMatch = new RegExp(`^${escapeRegex(query.category)}$`, 'i'); alternatives.push({ $or: [{ category: categoryMatch }, { subcategory: categoryMatch }] }); }
  if (query.subcategory) alternatives.push({ subcategory: new RegExp(`^${escapeRegex(query.subcategory)}$`, 'i') });
  if (query.size) filter.size = new RegExp(`^${escapeRegex(query.size)}$`, 'i');
  if (query.condition) filter.condition = query.condition;
  const price: Record<string, number> = {};
  if (query.minPricePaise !== undefined) price.$gte = query.minPricePaise;
  if (query.maxPricePaise !== undefined) price.$lte = query.maxPricePaise;
  if (Object.keys(price).length) filter.pricePaise = price;
  if (query.q) {
    const safeQuery = escapeRegex(query.q);
    alternatives.push({ $or: [{ title: new RegExp(safeQuery, 'i') }, { description: new RegExp(safeQuery, 'i') }, { brand: new RegExp(safeQuery, 'i') }, { category: new RegExp(safeQuery, 'i') }, { subcategory: new RegExp(safeQuery, 'i') }] });
  }
  if (alternatives.length) filter.$and = alternatives;
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1, _id: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    Product.countDocuments(filter),
  ]);
  const profileIds = [...new Set(items.map((item) => String(item.seller)))];
  const profiles = await SellerProfile.find({ user: { $in: profileIds }, status: 'approved' }).select('user displayName').lean();
  const names = new Map(profiles.map((profile) => [String(profile.user), profile.displayName]));
  res.json({ products: items.map((item) => publicProduct(item, names.get(String(item.seller)))), page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) });
}));

productsRouter.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) { res.status(404).json({ error: 'Product not found' }); return; }
  const product = await Product.findOne({ _id: req.params.id, status: 'approved', inventory: { $gt: 0 } }).lean();
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  const profile = await SellerProfile.findOne({ user: product.seller, status: 'approved' }).select('displayName').lean();
  res.json({ product: publicProduct(product, profile?.displayName) });
}));

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
