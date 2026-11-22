import type { RequestHandler } from 'express';
import { env } from '../config/env.js';

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
  // Signed provider callbacks are authenticated by their raw-body HMAC, not browser Origin.
  if (req.method === 'POST' && ['/api/v1/payments/webhooks/cashfree', '/api/v1/payments/webhooks/courier'].includes(req.path)) { next(); return; }
  if (unsafeMethods.has(req.method) && req.get('origin') !== env.CLIENT_ORIGIN) {
    res.status(403).json({ error: 'Request origin is not allowed' });
    return;
  }
  next();
};
