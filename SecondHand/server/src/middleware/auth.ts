import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { SellerProfile } from '../models/SellerProfile.js';
import { asyncHandler } from './asyncHandler.js';

export const SESSION_COOKIE = 'gosh_session';
export type AuthUser = { id: string; role: 'buyer' | 'seller' | 'admin'; status: 'active' | 'suspended' | 'closed' };
declare global { namespace Express { interface Request { authUser?: AuthUser } } }

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
  let claims: { sub: string; ver?: number };
  try { claims = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as { sub: string }; }
  catch { res.status(401).json({ error: 'Invalid or expired session' }); return; }
  if (!mongoose.isValidObjectId(claims.sub)) { res.status(401).json({ error: 'Invalid session' }); return; }
  const user = await User.findById(claims.sub).select('_id role status +sessionVersion');
  if (!user || user.status !== 'active') { res.status(401).json({ error: 'Account is unavailable' }); return; }
  if (claims.ver !== user.sessionVersion) { res.status(401).json({ error: 'Session is no longer valid' }); return; }
  req.authUser = { id: user.id, role: user.role as AuthUser['role'], status: user.status as AuthUser['status'] };
  next();
});

export function requireRole(...roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) { res.status(401).json({ error: 'Authentication required' }); return; }
    if (!roles.includes(req.authUser.role)) { res.status(403).json({ error: 'Insufficient permissions' }); return; }
    next();
  };
}

export const requireApprovedSeller = asyncHandler(async (req, res, next) => {
  if (!req.authUser || req.authUser.role !== 'seller') {
    res.status(403).json({ error: 'Seller access required' });
    return;
  }
  const approvedProfile = await SellerProfile.exists({ user: req.authUser.id, status: 'approved' });
  if (!approvedProfile) {
    res.status(403).json({ error: 'An approved seller application is required' });
    return;
  }
  next();
});
