import crypto from 'node:crypto';

/** Cashfree webhook signature: base64(HMAC-SHA256(secret, timestamp + exact raw body)). */
export function verifyCashfreeWebhook(rawBody: Buffer, timestamp: string, signature: string, secret: string): boolean {
  if (!rawBody.length || !timestamp || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(timestamp, 'utf8').update(rawBody).digest();
  let provided: Buffer;
  try { provided = Buffer.from(signature, 'base64'); } catch { return false; }
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}
