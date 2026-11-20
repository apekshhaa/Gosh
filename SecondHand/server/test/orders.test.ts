import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { SellerProfile } from '../src/models/SellerProfile.js';
import { Product } from '../src/models/Product.js';
import { Order } from '../src/models/Order.js';

let mongo: MongoMemoryReplSet;
beforeAll(async () => {
  const uri = process.env.MONGODB_TEST_URI;
  if (uri) {
    if (!new URL(uri).pathname.slice(1).endsWith('_test')) throw new Error('MONGODB_TEST_URI must use a database name ending in _test');
    await mongoose.connect(uri);
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (hello.setName) return;
    await mongoose.disconnect();
  }
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());
});
afterEach(async () => { await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))); });
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

const post = (path: string) => request(app).post(path).set('Origin', 'http://localhost:3000');
const patch = (path: string) => request(app).patch(path).set('Origin', 'http://localhost:3000');
const listing = { title: 'Pre-loved wool jacket', description: 'A carefully worn wool jacket in excellent condition.', category: 'womens', size: 'M', condition: 'excellent', pricePaise: 245050, imageUrls: ['/image.jpg'], inventory: 1, status: 'approved' };

describe('orders and inventory', () => {
  it('creates server-priced unpaid orders, snapshots items, and makes identical retries idempotent', async () => {
    const buyer = await account('order-buyer@example.com'); const seller = await approvedSeller('order-seller@example.com');
    const product = await Product.create({ ...listing, seller: seller.id });
    const first = await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'order-create-0001').send({ items: [{ productId: product.id, quantity: 1, selectedSize: 'M' }], totalPaise: 1 });
    expect(first.status).toBe(400); // Extra totals are rejected, never trusted.
    const deliveryAddress = { fullName: 'Order Buyer', phone: '9876543210', line1: '12 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001', country: 'IN' };
    const created = await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'order-create-0001').send({ items: [{ productId: product.id, quantity: 1, selectedSize: 'M' }], deliveryAddress });
    const retry = await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'order-create-0001').send({ items: [{ productId: product.id, quantity: 1, selectedSize: 'M' }], deliveryAddress });
    expect(created.status).toBe(201); expect(retry.status).toBe(200); expect(retry.body.replayed).toBe(true);
    expect(created.body.order).toMatchObject({ itemSubtotalPaise: 245050, totalPaise: 245050, paymentStatus: 'unpaid', status: 'pending_fulfillment', commissionRateBps: 2000, commissionBasisPaise: 245050, platformCommissionPaise: 49010, sellerSharePaise: 196040 });
    expect(created.body.order.items[0]).toMatchObject({ title: listing.title, selectedSize: 'M', quantity: 1, unitPricePaise: 245050 });
    expect(created.body.order.deliveryAddress).toMatchObject(deliveryAddress);
    expect((await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'order-create-0001').send({ items: [{ productId: product.id, quantity: 1, selectedSize: 'M' }], deliveryAddress: { ...deliveryAddress, city: 'Mumbai' } })).status).toBe(409);
    expect(await Order.countDocuments()).toBe(1); expect((await Product.findById(product.id))?.inventory).toBe(0);
  });

  it('requires authentication and keeps buyer history and details private', async () => {
    const buyer = await account('private-order@example.com'); const other = await account('other-order@example.com'); const seller = await approvedSeller('private-seller@example.com');
    const product = await Product.create({ ...listing, seller: seller.id });
    const created = await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'private-order-001').send({ items: [{ productId: product.id, quantity: 1 }] });
    expect((await request(app).get('/api/v1/orders/mine')).status).toBe(401);
    expect((await request(app).get('/api/v1/orders/mine').set('Cookie', other.cookie)).body.total).toBe(0);
    expect((await request(app).get(`/api/v1/orders/mine/${created.body.order._id}`).set('Cookie', other.cookie)).status).toBe(404);
  });

  it('rejects self-purchases, unavailable listings, and client price tampering', async () => {
    const buyer = await account('selfbuyer@example.com'); const seller = await approvedSeller('selfseller@example.com');
    const own = await Product.create({ ...listing, seller: buyer.id });
    const self = await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'self-order-001').send({ items: [{ productId: own.id, quantity: 1 }] });
    expect(self.status).toBe(400);
    const unavailable = await Product.create({ ...listing, seller: seller.id, status: 'pending_review' });
    const hidden = await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'hidden-order-001').send({ items: [{ productId: unavailable.id, quantity: 1 }] });
    expect(hidden.status).toBe(409);
    const tampered = await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'tamper-order-001').send({ items: [{ productId: own.id, quantity: 1, pricePaise: 1 }] });
    expect(tampered.status).toBe(400);
  });

  it('uses atomic conditional inventory updates under contention and enforces idempotency payloads', async () => {
    const one = await account('race-one@example.com'); const two = await account('race-two@example.com'); const seller = await approvedSeller('race-seller@example.com');
    const product = await Product.create({ ...listing, seller: seller.id });
    const buy = (buyer: typeof one, key: string) => post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', key).send({ items: [{ productId: product.id, quantity: 1 }] });
    const race = await Promise.all([buy(one, 'race-one-0001'), buy(two, 'race-two-0001')]);
    expect(race.map((response) => response.status).sort()).toEqual([201, 409]);
    expect((await Product.findById(product.id))?.inventory).toBe(0); expect(await Order.countDocuments()).toBe(1);
    const replayKey = race[0]!.status === 201 ? 'race-one-0001' : 'race-two-0001'; const winner = race[0]!.status === 201 ? one : two;
    expect((await buy(winner, replayKey)).status).toBe(200);
    expect((await post('/api/v1/orders').set('Cookie', winner.cookie).set('Idempotency-Key', replayKey).send({ items: [{ productId: product.id, quantity: 2 }] })).status).toBe(409);
  });

  it('restricts seller and admin routes, checks seller ownership, validates transitions and audits admin oversight', async () => {
    const buyer = await account('fulfillment-buyer@example.com'); const seller = await approvedSeller('fulfillment-seller@example.com'); const other = await approvedSeller('other-fulfillment@example.com');
    const product = await Product.create({ ...listing, seller: seller.id });
    const created = await post('/api/v1/orders').set('Cookie', buyer.cookie).set('Idempotency-Key', 'fulfill-order-001').send({ items: [{ productId: product.id, quantity: 1 }] });
    const orderId = created.body.order._id;
    expect((await request(app).get('/api/v1/orders/admin')).status).toBe(401);
    expect((await request(app).get('/api/v1/orders/admin').set('Cookie', buyer.cookie)).status).toBe(403);
    expect((await request(app).get('/api/v1/orders/seller').set('Cookie', other.cookie)).body.total).toBe(0);
    expect((await patch(`/api/v1/orders/seller/${orderId}/status`).set('Cookie', other.cookie).send({ status: 'processing' })).status).toBe(404);
    expect((await patch(`/api/v1/orders/seller/${orderId}/status`).set('Cookie', seller.cookie).send({ status: 'delivered' })).status).toBe(409);
    expect((await patch(`/api/v1/orders/admin/${orderId}/status`).set('Cookie', (await makeAdmin('unpaid-admin@example.com')).cookie).send({ status: 'processing', reason: 'Attempt before payment verification.' })).status).toBe(409);
    await Order.updateOne({ _id: orderId }, { $set: { paymentStatus: 'paid' } }); // Simulate verified provider confirmation for fulfillment transition tests.
    expect((await patch(`/api/v1/orders/seller/${orderId}/status`).set('Cookie', seller.cookie).send({ status: 'processing', paymentStatus: 'refunded' })).status).toBe(400);
    expect((await patch(`/api/v1/orders/seller/${orderId}/status`).set('Cookie', seller.cookie).send({ status: 'processing' })).status).toBe(200);
    expect((await patch(`/api/v1/orders/seller/${orderId}/status`).set('Cookie', seller.cookie).send({ status: 'shipped' })).status).toBe(200);
    const admin = await makeAdmin('order-admin@example.com');
    expect((await request(app).get('/api/v1/orders/admin').set('Cookie', admin.cookie)).body.total).toBe(1);
    const overseen = await patch(`/api/v1/orders/admin/${orderId}/status`).set('Cookie', admin.cookie).send({ status: 'delivered', reason: 'Delivery confirmation recorded by support.' });
    expect(overseen.status).toBe(200); expect(overseen.body.order.statusHistory.at(-1)).toMatchObject({ action: 'admin_oversight', fromStatus: 'shipped', toStatus: 'delivered' });
    expect(overseen.body.order.paymentStatus).toBe('paid');
  });
});

async function account(email: string) { const passwordHash = await bcrypt.hash('secure-password-123', 4); const user = await User.create({ name: 'Test User', email, passwordHash, role: 'buyer' }); const login = await post('/api/v1/auth/login').send({ email, password: 'secure-password-123' }); return { id: user.id, cookie: login.headers['set-cookie'] as string }; }
async function approvedSeller(email: string) { const user = await User.create({ name: 'Seller User', email, passwordHash: await bcrypt.hash('secure-password-123', 4), role: 'seller' }); await SellerProfile.create({ user: user.id, displayName: 'Seller Closet', legalName: 'Seller Name', address: { line1: '1 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001' }, agreementVersion: 'v1', agreementAcceptedAt: new Date(), status: 'approved' }); const login = await post('/api/v1/auth/login').send({ email, password: 'secure-password-123' }); return { id: user.id, cookie: login.headers['set-cookie'] as string }; }
async function makeAdmin(email: string) { const passwordHash = await bcrypt.hash('secure-password-123', 4); const user = await User.create({ name: 'Test Admin', email, passwordHash, role: 'admin' }); const login = await post('/api/v1/auth/login').send({ email, password: 'secure-password-123' }); return { id: user.id, cookie: login.headers['set-cookie'] as string }; }
