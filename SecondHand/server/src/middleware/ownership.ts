import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { asyncHandler } from './asyncHandler.js';

export const requireProductOwner = asyncHandler(async (req, res, next) => {
  const productId = req.params.id;
  if (!productId || !mongoose.isValidObjectId(productId)) { res.status(404).json({ error: 'Product not found' }); return; }
  const product = await Product.findById(productId).select('seller');
  if (!product) { res.status(404).json({ error: 'Product not found' }); return; }
  if (product.seller.toString() !== req.authUser?.id) { res.status(403).json({ error: 'You do not own this product' }); return; }
  next();
});
