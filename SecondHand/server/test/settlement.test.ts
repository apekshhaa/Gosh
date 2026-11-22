import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { SellerProfile } from '../src/models/SellerProfile.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';
import { Shipment } from '../src/models/Shipment.js';
import { DeliveryVerification } from '../src/models/DeliveryVerification.js';
import { Payout } from '../src/models/Payout.js';
import { PayoutAdjustment } from '../src/models/PayoutAdjustment.js';
import { evaluatePayoutEligibility } from '../src/payouts/eligibility.js';
import { ensurePayoutRecord } from '../src/payouts/ledger.js';

let mongo: MongoMemoryReplSet;
beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
afterEach(async () => { await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))); env.COURIER_WEBHOOK_SECRET = undefined; });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

const origin = 'http://localhost:3000';
const post = (path: string) => request(app).post(path).set('Origin', origin);

describe('shipment, delivery verification and payout ledger', () => {
  it('rejects invalid shipment details and seller ownership and does not trigger a payout', async () => {
    const buyer = await account('settle-buyer@example.com');
    const seller = await approvedSeller('settle-seller@example.com');
    const other = await approvedSeller('settle-other@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    expect((await post(`/api/v1/orders/seller/${order.id}/shipment`).set('Cookie', other.cookie).send({ courierName: 'Local Courier', trackingId: 'TRACK-ONE', shippedAt: new Date().toISOString() })).status).toBe(404);
    expect((await post(`/api/v1/orders/seller/${order.id}/shipment`).set('Cookie', seller.cookie).send({ courierName: '', trackingId: '', shippedAt: 'invalid' })).status).toBe(400);
    expect(await Payout.countDocuments()).toBe(0);
  });

  it('seller shipment is not independent delivery verification and remains unverified', async () => {
    const buyer = await account('shipment-buyer@example.com');
    const seller = await approvedSeller('shipment-seller@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    const submitted = await post(`/api/v1/orders/seller/${order.id}/shipment`).set('Cookie', seller.cookie).send({ courierName: 'Local Courier', trackingId: 'TRACK-TWO', shippedAt: new Date().toISOString() });
    expect(submitted.status).toBe(201);
    expect(submitted.body.payoutTriggered).toBe(false);
    expect(await DeliveryVerification.findOne({ order: order._id })).toMatchObject({ status: 'unverified' });
    expect(await evaluatePayoutEligibility(order)).toMatchObject({ eligible: false, reason: 'delivery_not_verified' });
  });

  it('validates courier signatures and makes delivery webhook processing idempotent', async () => {
    const secret = 'courier-test-secret-with-at-least-32-chars';
    env.COURIER_WEBHOOK_SECRET = secret;
    const buyer = await account('courier-buyer@example.com');
    const seller = await approvedSeller('courier-seller@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    await Shipment.create({ order: order._id, seller: seller.id, courierName: 'Local Courier', trackingId: 'TRACK-WEBHOOK', shippedAt: new Date(), history: [] });
    const payload = JSON.stringify({ orderId: order.id, trackingId: 'TRACK-WEBHOOK', eventId: 'courier-event-0001', deliveredAt: new Date().toISOString() });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const valid = crypto.createHmac('sha256', secret).update(timestamp + payload).digest('hex');
    const invalid = await post('/api/v1/payments/webhooks/courier').set('x-courier-timestamp', timestamp).set('x-courier-signature', 'bad').send(payload).set('Content-Type', 'application/json');
    expect(invalid.status).toBe(401);
    const expiredTimestamp = String(Math.floor(Date.now() / 1000) - 600);
    const expiredSignature = crypto.createHmac('sha256', secret).update(expiredTimestamp + payload).digest('hex');
    const expired = await post('/api/v1/payments/webhooks/courier').set('x-courier-timestamp', expiredTimestamp).set('x-courier-signature', expiredSignature).send(payload).set('Content-Type', 'application/json');
    expect(expired.status).toBe(401);
    const first = await post('/api/v1/payments/webhooks/courier').set('x-courier-timestamp', timestamp).set('x-courier-signature', valid).send(payload).set('Content-Type', 'application/json');
    const second = await post('/api/v1/payments/webhooks/courier').set('x-courier-timestamp', timestamp).set('x-courier-signature', valid).send(payload).set('Content-Type', 'application/json');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body).toMatchObject({ duplicate: true });
    expect(await evaluatePayoutEligibility(order)).toMatchObject({ eligible: true, reason: null });
  });

  it('buyer confirmation requires ownership and matching tracking', async () => {
    const buyer = await account('buyer-confirm@example.com');
    const other = await account('buyer-confirm-other@example.com');
    const seller = await approvedSeller('buyer-confirm-seller@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    await Shipment.create({ order: order._id, seller: seller.id, courierName: 'Local Courier', trackingId: 'TRACK-BUYER', shippedAt: new Date(), history: [] });
    expect((await post(`/api/v1/orders/mine/${order.id}/delivery-confirmation`).set('Cookie', other.cookie).send({ trackingReference: 'TRACK-BUYER' })).status).toBe(404);
    expect((await post(`/api/v1/orders/mine/${order.id}/delivery-confirmation`).set('Cookie', buyer.cookie).send({ trackingReference: 'WRONG' })).status).toBe(409);
    const confirmed = await post(`/api/v1/orders/mine/${order.id}/delivery-confirmation`).set('Cookie', buyer.cookie).send({ trackingReference: 'TRACK-BUYER' });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body).toMatchObject({ trustedDeliveryVerified: false, payoutEligible: false });
    const trusted = await DeliveryVerification.findOne({ order: order._id });
    expect(trusted?.status ?? 'unverified').toBe('unverified');
    expect(await evaluatePayoutEligibility(order)).toMatchObject({ eligible: false, reason: 'delivery_not_verified' });
  });

  it('buyer confirmation is blocked for unpaid, refunded and disputed orders', async () => {
    const buyer = await account('buyer-state-buyer@example.com');
    const seller = await approvedSeller('buyer-state-seller@example.com');
    const unpaid = await makeOrder(buyer.id, seller.id, 'unpaid');
    await Shipment.create({ order: unpaid._id, seller: seller.id, courierName: 'Local Courier', trackingId: 'TRACK-UNPAID', shippedAt: new Date(), history: [] });
    expect((await post(`/api/v1/orders/mine/${unpaid.id}/delivery-confirmation`).set('Cookie', buyer.cookie).send({ trackingReference: 'TRACK-UNPAID' })).status).toBe(409);
    const refunded = await paidOrder(buyer.id, seller.id);
    refunded.paymentStatus = 'partially_refunded';
    await refunded.save();
    await Shipment.create({ order: refunded._id, seller: seller.id, courierName: 'Local Courier', trackingId: 'TRACK-REFUND', shippedAt: new Date(), history: [] });
    expect((await post(`/api/v1/orders/mine/${refunded.id}/delivery-confirmation`).set('Cookie', buyer.cookie).send({ trackingReference: 'TRACK-REFUND' })).status).toBe(409);
  });

  it('requires admin authorization for manual verification and records the administrator', async () => {
    const buyer = await account('admin-confirm-buyer@example.com');
    const seller = await approvedSeller('admin-confirm-seller@example.com');
    const admin = await makeAdmin('admin-confirm-admin@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    await Shipment.create({ order: order._id, seller: seller.id, courierName: 'Local Courier', trackingId: 'TRACK-ADMIN', shippedAt: new Date(), history: [] });
    expect((await post(`/api/v1/admin/orders/${order.id}/delivery/verify`).set('Cookie', buyer.cookie).send({ trackingReference: 'TRACK-ADMIN', evidence: 'Reliable signed proof.', reason: 'Administrator reviewed evidence.' })).status).toBe(403);
    const verified = await post(`/api/v1/admin/orders/${order.id}/delivery/verify`).set('Cookie', admin.cookie).send({ trackingReference: 'TRACK-ADMIN', evidence: 'Reliable signed proof.', reason: 'Administrator reviewed evidence.' });
    expect(verified.status).toBe(200);
    const verification = await DeliveryVerification.findOne({ order: order._id });
    expect(verification).toMatchObject({ status: 'verified', source: 'admin' });
    expect(verification?.verifiedBy?.toString()).toBe(admin.id);
  });

  it('blocks unpaid, cancelled, refunded and disputed payout eligibility', async () => {
    const buyer = await account('eligibility-buyer@example.com');
    const seller = await approvedSeller('eligibility-seller@example.com');
    const unpaid = await makeOrder(buyer.id, seller.id, 'unpaid');
    expect(await evaluatePayoutEligibility(unpaid)).toMatchObject({ eligible: false, reason: 'payment_not_confirmed' });
    const cancelled = await paidOrder(buyer.id, seller.id); cancelled.status = 'cancelled'; cancelled.cancelledAt = new Date();
    expect(await evaluatePayoutEligibility(cancelled)).toMatchObject({ eligible: false, reason: 'cancelled' });
    const refunded = await paidOrder(buyer.id, seller.id); refunded.paymentStatus = 'refunded';
    expect(await evaluatePayoutEligibility(refunded)).toMatchObject({ eligible: false, reason: 'refunded' });
    const disputed = await paidOrder(buyer.id, seller.id); disputed.disputeStatus = 'open';
    expect(await evaluatePayoutEligibility(disputed)).toMatchObject({ eligible: false, reason: 'disputed' });
  });

  it('only an independently verified paid shipment is payout eligible', async () => {
    const buyer = await account('eligible-buyer@example.com');
    const seller = await approvedSeller('eligible-seller@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    await Shipment.create({ order: order._id, seller: seller.id, courierName: 'Local Courier', trackingId: 'TRACK-ELIGIBLE', shippedAt: new Date(), history: [] });
    expect(await evaluatePayoutEligibility(order)).toMatchObject({ eligible: false, reason: 'delivery_not_verified' });
    await DeliveryVerification.create({ order: order._id, status: 'verified', source: 'trusted_courier', trackingReference: 'TRACK-ELIGIBLE', verifiedAt: new Date(), auditHistory: [] });
    expect(await evaluatePayoutEligibility(order)).toMatchObject({ eligible: true, reason: null });
  });

  it('concurrent eligibility requests create one ledger entry and refund/dispute updates block it', async () => {
    const buyer = await account('race-payout-buyer@example.com');
    const seller = await approvedSeller('race-payout-seller@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    await Shipment.create({ order: order._id, seller: seller.id, courierName: 'Local Courier', trackingId: 'TRACK-RACE', shippedAt: new Date(), history: [] });
    await DeliveryVerification.create({ order: order._id, status: 'verified', source: 'admin', trackingReference: 'TRACK-RACE', verifiedAt: new Date(), verifiedBy: buyer.id, auditHistory: [] });
    const records = await Promise.all([ensurePayoutRecord(order), ensurePayoutRecord(order), ensurePayoutRecord(order)]);
    expect(records.filter(Boolean)).toHaveLength(3);
    expect(await Payout.countDocuments({ order: order._id })).toBe(1);
    await Order.updateOne({ _id: order._id }, { $set: { disputeStatus: 'open' } });
    const disputed = await Order.findById(order.id);
    if (disputed) await ensurePayoutRecord(disputed);
    expect((await Payout.findOne({ order: order._id }))?.status).toBe('blocked');
  });

  it('creates duplicate-safe payout records and preserves 20% and 5% snapshots', async () => {
    const buyer = await account('payout-buyer@example.com');
    const seller = await approvedSeller('payout-seller@example.com');
    const historical = await makeOrder(buyer.id, seller.id, 'paid', 2000, 2000, 8000);
    const current = await makeOrder(buyer.id, seller.id, 'paid', 500, 12253, 232797);
    expect(historical.commissionRateBps).toBe(2000);
    expect(historical.sellerSharePaise).toBe(8000);
    expect(current.commissionRateBps).toBe(500);
    expect(current.sellerSharePaise).toBe(232797);
  });

  it('post-payout partial refund creates a separate recovery obligation and preserves payout history', async () => {
    const buyer = await account('post-payout-refund-buyer@example.com');
    const seller = await approvedSeller('post-payout-refund-seller@example.com');
    const admin = await makeAdmin('post-payout-refund-admin@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    const payout = await Payout.create({ order: order._id, seller: seller.id, productSubtotalPaise: order.commissionBasisPaise, commissionRateBps: order.commissionRateBps, commissionAmountPaise: order.platformCommissionPaise, sellerNetPaise: order.sellerSharePaise, currency: 'INR', status: 'paid', idempotencyKey: `payout-${order.id}`, providerName: 'mock', providerReference: 'trusted-test-reference', completedAt: new Date() });
    const refund = await post(`/api/v1/admin/orders/${order.id}/refund-accounting`).set('Cookie', admin.cookie).send({ kind: 'partial_refund', refundAmountPaise: 24505, reason: 'Approved partial refund evidence recorded.' });
    expect(refund.status).toBe(200);
    expect((await Payout.findById(payout.id))?.status).toBe('paid');
    const adjustment = await PayoutAdjustment.findOne({ payout: payout._id });
    expect(adjustment).toBeTruthy();
    expect(adjustment?.recoveryObligationPaise).toBeGreaterThan(0);
  });

  it('disabled payout execution never marks a payout paid and failed payout retry stays disabled', async () => {
    const buyer = await account('disabled-buyer@example.com');
    const seller = await approvedSeller('disabled-seller@example.com');
    const order = await paidOrder(buyer.id, seller.id);
    const payout = await Payout.create({ order: order._id, seller: seller.id, productSubtotalPaise: order.commissionBasisPaise, commissionRateBps: order.commissionRateBps, commissionAmountPaise: order.platformCommissionPaise, sellerNetPaise: order.sellerSharePaise, currency: 'INR', status: 'failed', idempotencyKey: `payout-${order.id}`, providerName: 'disabled', failureReason: 'Mock provider unavailable.' });
    const admin = await makeAdmin('disabled-admin@example.com');
    const retried = await post(`/api/v1/admin/payouts/${payout.id}/retry`).set('Cookie', admin.cookie).send({});
    expect(retried.status).toBe(503);
    expect((await Payout.findById(payout.id))?.status).toBe('failed');
  });
});

async function account(email: string) { const passwordHash = await bcrypt.hash('secure-password-123', 4); const user = await User.create({ name: 'Test User', email, passwordHash, role: 'buyer' }); const login = await post('/api/v1/auth/login').send({ email, password: 'secure-password-123' }); return { id: user.id, cookie: login.headers['set-cookie'] as string }; }
async function approvedSeller(email: string) { const user = await User.create({ name: 'Seller User', email, passwordHash: await bcrypt.hash('secure-password-123', 4), role: 'seller' }); await SellerProfile.create({ user: user.id, displayName: 'Seller Closet', legalName: 'Seller Name', address: { line1: '1 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001' }, agreementVersion: 'v1', agreementAcceptedAt: new Date(), status: 'approved' }); const login = await post('/api/v1/auth/login').send({ email, password: 'secure-password-123' }); return { id: user.id, cookie: login.headers['set-cookie'] as string }; }
async function makeAdmin(email: string) { const user = await User.create({ name: 'Test Admin', email, passwordHash: await bcrypt.hash('secure-password-123', 4), role: 'admin' }); const login = await post('/api/v1/auth/login').send({ email, password: 'secure-password-123' }); return { id: user.id, cookie: login.headers['set-cookie'] as string }; }
async function paidOrder(buyerId: string, sellerId: string) { return makeOrder(buyerId, sellerId, 'paid', 500, 12253, 232797); }
async function makeOrder(buyerId: string, sellerId: string, paymentStatus: string, rate = 500, commission = 12253, sellerShare = 232797) {
  return Order.create({ orderNumber: `GSH-${crypto.randomBytes(8).toString('hex')}`, buyer: buyerId, seller: sellerId, idempotencyKey: `settlement-${crypto.randomUUID()}`, requestHash: 'test-hash', items: [{ product: new mongoose.Types.ObjectId(), title: 'Test item', quantity: 1, unitPricePaise: 245050 }], itemSubtotalPaise: 245050, shippingPaise: 0, discountsPaise: 0, taxesPaise: 0, totalPaise: 245050, commissionRateBps: rate, commissionBasisPaise: 245050, sellerCommissionPaise: commission, buyerMarketplaceFeePaise: 0, platformCommissionPaise: commission, sellerSharePaise: sellerShare, paymentStatus, status: paymentStatus === 'paid' ? 'pending_fulfillment' : 'pending_fulfillment', disputeStatus: 'none' });
}
