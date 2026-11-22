import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { requireAuth, SESSION_COOKIE } from '../middleware/auth.js';

export const authRouter = Router();
const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
}).strict();
const registerCredentialsSchema = z.object({ email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()), password: z.string().min(10).max(128) });
const registerSchema = registerCredentialsSchema.extend({ name: z.string().trim().min(1).max(100), phone: z.string().trim().max(30).optional() });
export function getSessionCookieOptions(nodeEnv: typeof env.NODE_ENV = env.NODE_ENV, cookieSecure: boolean = env.COOKIE_SECURE) {
  return {
    httpOnly: true,
    secure: cookieSecure || nodeEnv === 'production',
    sameSite: (nodeEnv === 'production' ? 'none' : 'strict') as 'none' | 'strict',
    path: '/',
  };
}

function publicUser(user: { _id: unknown; name: string; email: string; role: string; emailVerified: boolean; phoneVerified: boolean; status: string }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified, phoneVerified: user.phoneVerified, status: user.status };
}

function setSession(res: Response, userId: string, sessionVersion: number) {
  const token = jwt.sign({ ver: sessionVersion }, env.JWT_SECRET, { algorithm: 'HS256', subject: userId, expiresIn: '7d' });
  res.cookie(SESSION_COOKIE, token, { ...getSessionCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000 });
}

authRouter.post('/register', asyncHandler(async (req, res) => {
  const input = registerSchema.parse(req.body);
  if (await User.exists({ email: input.email })) { res.status(409).json({ error: 'An account with this email already exists' }); return; }
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({ name: input.name, email: input.email, passwordHash, phone: input.phone, role: 'buyer' });
  setSession(res, String(user._id), user.sessionVersion);
  res.status(201).json({ user: publicUser(user) });
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const field = first?.path[0];
    res.status(400).json({ error: field === 'email' ? 'Enter a valid email address' : field === 'password' ? 'Password is required' : 'Invalid login details' });
    return;
  }
  const input = parsed.data;
  const user = await User.findOne({ email: input.email }).select('+passwordHash +sessionVersion');
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) { res.status(401).json({ error: 'Invalid email or password' }); return; }
  if (user.status !== 'active') { res.status(403).json({ error: 'This account is unavailable' }); return; }
  setSession(res, String(user._id), user.sessionVersion);
  res.json({ user: publicUser(user) });
}));

authRouter.post('/logout', asyncHandler(async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    try {
      const claims = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as { sub: string; ver?: number };
      if (claims.ver !== undefined) await User.updateOne({ _id: claims.sub, sessionVersion: claims.ver }, { $inc: { sessionVersion: 1 } });
    } catch { /* Always clear malformed or expired browser cookies. */ }
  }
  res.clearCookie(SESSION_COOKIE, getSessionCookieOptions());
  res.status(204).end();
}));

authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.authUser!.id);
  if (!user) { res.status(401).json({ error: 'Account is unavailable' }); return; }
  res.json({ user: publicUser(user) });
}));
