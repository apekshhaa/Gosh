import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { Order } from '../src/models/Order.js';
import { PaymentAttempt } from '../src/models/PaymentAttempt.js';
import { PaymentEvent } from '../src/models/PaymentEvent.js';
import { User } from '../src/models/User.js';
import { calculateCommission } from '../src/payments/commission.js';
import { app } from '../src/app.js';
import request from 'supertest';
import mongoose from 'mongoose';

const origin = 'http://localhost:3000';
const secret = 'test-webhook-secret-not-a-real-provider-secret';
beforeAll(async () => {
  const uri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/gosh_marketplace_test';
  if (!new URL(uri).pathname.slice(1).endsWith('_test')) throw new Error('MONGODB_TEST_URI must use a database name ending in _test');
  await mongoose.connect(uri);
});
afterEach(async () => { await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))); });
afterAll(async () => { await mongoose.disconnect(); });
afterEach(() => { env.CASHFREE_WEBHOOK_SECRET = undefined; });

describe('payment foundation', () => {
  it('calculates 5% seller-only shares in paise with half-up rounding and discounts', () => {
    expect(calculateCommission(100000)).toMatchObject({ rateBps: 500, eligibleSubtotalPaise: 100000, sellerCommissionPaise: 5000, sellerSharePaise: 95000, buyerMarketplaceFeePaise: 0, platformCommissionPaise: 5000 });
    expect(calculateCommission(99900)).toMatchObject({ rateBps: 500, eligibleSubtotalPaise: 99900, sellerCommissionPaise: 4995, sellerSharePaise: 94905, buyerMarketplaceFeePaise: 0 });
    expect(calculateCommission(10)).toMatchObject({ sellerCommissionPaise: 1, sellerSharePaise: 9, buyerMarketplaceFeePaise: 0 });
    expect(calculateCommission(100100, 100)).toMatchObject({ eligibleSubtotalPaise: 100000, sellerCommissionPaise: 5000, sellerSharePaise: 95000, buyerMarketplaceFeePaise: 0 });
    expect(() => calculateCommission(10, 11)).toThrow(RangeError);
  });

  it('excludes shipping and taxes because they are not part of the commission basis', () => {
    const result = calculateCommission(100000);
    expect(result).toMatchObject({ eligibleSubtotalPaise: 100000, sellerCommissionPaise: 5000, sellerSharePaise: 95000, buyerMarketplaceFeePaise: 0 });
  });

  it('requires an authenticated order owner and fails closed while provider initiation is unavailable', async () => {
    const buyer = await makeBuyer('payment-owner@example.com');
    const other = await makeBuyer('payment-other@example.com');
    const order = await makeOrder(buyer.id);
    expect(order).toMatchObject({ commissionRateBps: 2000, commissionBasisPaise: 10000, sellerCommissionPaise: 2000, platformCommissionPaise: 2000, sellerSharePaise: 8000, buyerMarketplaceFeePaise: 0 });
    const route = `/api/v1/orders/${order.id}/payment-attempts`;
    expect((await request(app).post(route).set('Origin', origin).set('Idempotency-Key', 'payment-key-0001').send({})).status).toBe(401);
    expect((await request(app).post(route).set('Origin', origin).set('Cookie', other.cookie).set('Idempotency-Key', 'payment-key-0001').send({})).status).toBe(404);
    expect((await request(app).post(route).set('Origin', origin).set('Cookie', buyer.cookie).set('Idempotency-Key', 'payment-key-0001').send({})).status).toBe(503);
    expect((await request(app).post(route).set('Origin', origin).set('Cookie', buyer.cookie).set('Idempotency-Key', 'payment-key-0001').send({})).status).toBe(503);
    expect(await PaymentAttempt.countDocuments()).toBe(0);
  });

  it('rejects forged signatures and amount mismatches and fails closed without provider credentials', async () => {
    env.CASHFREE_WEBHOOK_SECRET = secret;
    const buyer = await makeBuyer('webhook-buyer@example.com');
    const order = await makeOrder(buyer.id);
    const attempt = await PaymentAttempt.create({ order: order._id, buyer: buyer.id, provider: 'cashfree', idempotencyKey: 'attempt-key-0001', amountPaise: order.totalPaise, currency: 'INR', providerOrderId: 'provider-order-001', status: 'pending', expiresAt: new Date(Date.now() + 60_000) });
    const webhook = (amount: number, status: 'SUCCESS' | 'FAILED' = 'SUCCESS') => ({ type: `PAYMENT_${status}_WEBHOOK`, event_time: '2026-10-23T10:00:00+05:30', data: { order: { order_id: 'provider-order-001', order_amount: 100, order_currency: 'INR' }, payment: { cf_payment_id: `cf-pay-${status.toLowerCase()}`, payment_status: status, payment_amount: amount, payment_currency: 'INR' } } });
    const sendWebhook = async (payload: ReturnType<typeof webhook>, validSignature = true) => {
      const raw = JSON.stringify(payload); const timestamp = '1792735200';
      const signature = crypto.createHmac('sha256', secret).update(timestamp + raw).digest('base64');
      return request(app).post('/api/v1/payments/webhooks/cashfree').set('Origin', origin).set('x-webhook-timestamp', timestamp).set('x-webhook-signature', validSignature ? signature : 'forged').set('Content-Type', 'application/json').send(raw);
    };
    expect((await sendWebhook(webhook(100), false)).status).toBe(401);
    expect((await sendWebhook(webhook(99.99))).status).toBe(409);
    expect((await sendWebhook(webhook(100, 'FAILED'))).status).toBe(503);
    expect((await sendWebhook(webhook(100))).status).toBe(503);
    expect((await Order.findById(order.id))?.paymentStatus).toBe('unpaid');
    expect((await PaymentAttempt.findById(attempt.id))?.status).toBe('pending');
    expect(await PaymentEvent.countDocuments()).toBe(0);
  });
});

async function makeBuyer(email: string) {
  const user = await User.create({ name: 'Payment Buyer', email, passwordHash: await bcrypt.hash('secure-password-123', 4), role: 'buyer' });
  const response = await request(app).post('/api/v1/auth/login').set('Origin', origin).send({ email, password: 'secure-password-123' });
  return { id: String(user._id), cookie: response.headers['set-cookie'] as string };
}

async function makeOrder(buyerId: string) {
  const seller = await User.create({ name: 'Payment Seller', email: `seller-${crypto.randomUUID()}@example.com`, passwordHash: await bcrypt.hash('secure-password-123', 4), role: 'seller' });
  return Order.create({ orderNumber: `GSH-${crypto.randomBytes(6).toString('hex')}`, buyer: buyerId, seller: seller._id, idempotencyKey: `order-${crypto.randomUUID()}`, requestHash: 'test-hash', items: [{ product: new mongoose.Types.ObjectId(), title: 'Historical 20% dress', quantity: 1, unitPricePaise: 10000 }], itemSubtotalPaise: 10000, shippingPaise: 0, discountsPaise: 0, taxesPaise: 0, totalPaise: 10000, commissionRateBps: 2000, commissionBasisPaise: 10000, sellerCommissionPaise: 2000, buyerMarketplaceFeePaise: 0, platformCommissionPaise: 2000, sellerSharePaise: 8000 });
}
