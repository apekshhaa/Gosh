import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.js';
import { sellerRouter } from './routes/seller.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { requireTrustedOrigin } from './middleware/csrf.js';
import { requireAuth } from './middleware/auth.js';
import { asyncHandler } from './middleware/asyncHandler.js';
import { User } from './models/User.js';
import { adminRouter } from './routes/admin.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { paymentsRouter } from './routes/payments.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

export const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: '7mb', verify: (req, _res, buffer) => { (req as typeof req & { rawBody?: Buffer }).rawBody = Buffer.from(buffer); } }));
app.use(cookieParser());
app.use(requireTrustedOrigin);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, skip: () => env.NODE_ENV === 'test', message: { error: 'Too many authentication attempts. Please try again later.' } });
app.get('/api/v1/health', (_req, res) => { res.json({ status: 'ok' }); });
app.get('/api/v1/health/ready', (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready', database: ready ? 'connected' : 'disconnected' });
});
app.get('/api/v1/uploads/:owner/:filename', asyncHandler(async (req, res) => {
  const owner = req.params.owner;
  const imageName = req.params.filename;
  if (typeof owner !== 'string' || !/^[a-f\d]{24}$/i.test(owner) || typeof imageName !== 'string' || !/^[a-f0-9-]{36}\.(?:jpg|png|webp)$/i.test(imageName)) { res.status(404).json({ error: 'Image not found' }); return; }
  const filename = path.join(process.cwd(), 'uploads', owner, imageName);
  try { await fs.access(filename); res.setHeader('Cache-Control', 'public, max-age=86400'); res.sendFile(filename); }
  catch { res.status(404).json({ error: 'Image not found' }); }
}));
app.use('/api/v1/auth', authLimiter, authRouter);
const sellerApplicationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, skip: () => env.NODE_ENV === 'test', message: { error: 'Too many seller application attempts. Please try again later.' } });
app.use('/api/v1/seller/apply', sellerApplicationLimiter);
app.use('/api/v1/seller', sellerRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/payments', paymentsRouter);
app.get('/api/v1/users/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.authUser!.id);
  if (!user) { res.status(401).json({ error: 'Account is unavailable' }); return; }
  res.json({ user: { id: String(user._id), name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, phoneVerified: user.phoneVerified, status: user.status } });
}));
app.use(notFoundHandler);
app.use(errorHandler);
