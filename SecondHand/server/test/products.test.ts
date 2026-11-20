import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { SellerProfile } from '../src/models/SellerProfile.js';
import { Product } from '../src/models/Product.js';

const apiPost = (path: string) => request(app).post(path).set('Origin', 'http://localhost:3000');
const productBody = { title: 'Pre-loved cotton shirt', description: 'A carefully worn cotton shirt in excellent shape.', category: 'womens', subcategory: 'tops', brand: 'GOSH Closet', size: 'M', condition: 'excellent', pricePaise: 125000, imageUrls: [], inventory: 1 };
let mongo: MongoMemoryServer;
beforeAll(async () => {
  const testUri = process.env.MONGODB_TEST_URI;
  if (testUri) {
    const databaseName = new URL(testUri).pathname.slice(1);
    if (!databaseName.endsWith('_test')) throw new Error('MONGODB_TEST_URI must use a database name ending in _test');
    await mongoose.connect(testUri);
  } else {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }
});
afterEach(async () => { await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))); });
afterAll(async () => { await mongoose.disconnect(); if (mongo) await mongo.stop(); });

describe('marketplace product API', () => {
  it('shows only approved available products, with pagination and filters', async () => {
    const seller = await makeSeller('public-seller@example.com');
    await Product.create([{ ...productBody, seller: seller.id, title: 'Blue cotton shirt', status: 'approved' }, { ...productBody, seller: seller.id, title: 'Black wool skirt', subcategory: 'skirts', pricePaise: 150000, status: 'approved' }, { ...productBody, seller: seller.id, status: 'pending_review' }, { ...productBody, seller: seller.id, title: 'Unavailable shirt', status: 'sold' }]);
    const first = await request(app).get('/api/v1/products?q=Blue&category=TOPS&size=m&condition=excellent&minPricePaise=100000&maxPricePaise=140000&limit=1&page=1');
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ total: 1, page: 1, limit: 1 });
    expect(first.body.products[0].title).toBe('Blue cotton shirt');
    expect(first.body.products[0]).not.toHaveProperty('status');
    const pageOne = await request(app).get('/api/v1/products?limit=1&page=1');
    const pageTwo = await request(app).get('/api/v1/products?limit=1&page=2');
    expect(pageOne.body.total).toBe(2); expect(pageTwo.body.total).toBe(2);
    expect(pageOne.body.products[0].id).not.toBe(pageTwo.body.products[0].id);
    const pendingDetail = await request(app).get(`/api/v1/products/${(await Product.findOne({ status: 'pending_review' }))!.id}`);
    expect(pendingDetail.status).toBe(404);
  });

  it('allows approved sellers to create, list, update, and archive their own listings', async () => {
    const owner = await makeSeller('owner-products@example.com');
    const created = await apiPost('/api/v1/seller/products').set('Cookie', owner.cookie).send(productBody);
    expect(created.status).toBe(201);
    expect(created.body.product).toMatchObject({ seller: owner.id, status: 'pending_review', pricePaise: 125000, inventory: 1 });
    const visible = await request(app).get('/api/v1/products');
    expect(visible.body.products).toHaveLength(0);
    const list = await request(app).get('/api/v1/seller/products?status=pending_review').set('Cookie', owner.cookie);
    expect(list.status).toBe(200); expect(list.body.total).toBe(1);
    const changed = await request(app).patch(`/api/v1/seller/products/${created.body.product._id}`).set('Cookie', owner.cookie).set('Origin', 'http://localhost:3000').send({ title: 'Updated cotton shirt' });
    expect(changed.status).toBe(200); expect(changed.body.product.status).toBe('pending_review');
    const removed = await request(app).delete(`/api/v1/seller/products/${created.body.product._id}`).set('Cookie', owner.cookie).set('Origin', 'http://localhost:3000');
    expect(removed.status).toBe(204);
    expect((await Product.findById(created.body.product._id))?.status).toBe('removed');
  });

  it('rejects invalid listing prices and inventory, and enforces seller approval', async () => {
    const buyer = await register('ordinary-buyer@example.com');
    const invalidPrice = await apiPost('/api/v1/seller/products').set('Cookie', buyer.cookie).send({ ...productBody, pricePaise: 12.5 });
    expect(invalidPrice.status).toBe(403);
    const owner = await makeSeller('approved-products@example.com');
    const badPrice = await apiPost('/api/v1/seller/products').set('Cookie', owner.cookie).send({ ...productBody, pricePaise: 12.5 });
    const badInventory = await apiPost('/api/v1/seller/products').set('Cookie', owner.cookie).send({ ...productBody, inventory: 0 });
    expect(badPrice.status).toBe(400); expect(badInventory.status).toBe(400);
    const foreignImage = await apiPost('/api/v1/seller/products').set('Cookie', owner.cookie).send({ ...productBody, imageUrls: [`/api/v1/uploads/${buyer.id}/11111111-1111-4111-8111-111111111111.jpg`] });
    expect(foreignImage.status).toBe(400);
    const pending = await register('pending-products@example.com');
    await apiPost('/api/v1/seller/apply').set('Cookie', pending.cookie).send(applicationBody);
    await User.updateOne({ _id: pending.id }, { $set: { role: 'seller' } });
    const blocked = await apiPost('/api/v1/seller/products').set('Cookie', pending.cookie).send(productBody);
    expect(blocked.status).toBe(403);
  });

  it('enforces product ownership for edit, removal, and seller detail operations', async () => {
    const owner = await makeSeller('ownership-owner@example.com'); const other = await makeSeller('ownership-other@example.com');
    const product = await Product.create({ ...productBody, seller: owner.id, status: 'pending_review' });
    const update = await request(app).patch(`/api/v1/seller/products/${product.id}`).set('Cookie', other.cookie).set('Origin', 'http://localhost:3000').send({ title: 'Not yours' });
    const remove = await request(app).delete(`/api/v1/seller/products/${product.id}`).set('Cookie', other.cookie).set('Origin', 'http://localhost:3000');
    const detail = await request(app).get(`/api/v1/seller/products/${product.id}`).set('Cookie', other.cookie);
    expect(update.status).toBe(403); expect(remove.status).toBe(403); expect(detail.status).toBe(403);
    expect((await Product.findById(product.id))?.title).toBe(productBody.title);
  });

  it('protects moderation and records admin approval and rejection reasons', async () => {
    const seller = await makeSeller('moderation-seller@example.com');
    const first = await Product.create({ ...productBody, seller: seller.id, status: 'pending_review' });
    const second = await Product.create({ ...productBody, seller: seller.id, title: 'Another careful shirt', status: 'pending_review' });
    const anonymous = await request(app).get('/api/v1/admin/products');
    const buyer = await register('moderation-buyer@example.com');
    const forbidden = await apiPost(`/api/v1/admin/products/${first.id}/approve`).set('Cookie', buyer.cookie).send({});
    expect(anonymous.status).toBe(401); expect(forbidden.status).toBe(403);
    const admin = await makeAdmin('products-admin@example.com');
    const pending = await request(app).get('/api/v1/admin/products').set('Cookie', admin.cookie);
    expect(pending.status).toBe(200); expect(pending.body.total).toBe(2);
    const approved = await apiPost(`/api/v1/admin/products/${first.id}/approve`).set('Cookie', admin.cookie).send({ reason: 'The photos and listing details meet the marketplace standards.' });
    const rejected = await apiPost(`/api/v1/admin/products/${second.id}/reject`).set('Cookie', admin.cookie).send({ reason: 'Please add a clear photo of the label.' });
    expect(approved.status).toBe(200); expect(approved.body.product).toMatchObject({ status: 'approved', moderationReason: 'The photos and listing details meet the marketplace standards.' });
    expect(rejected.status).toBe(200); expect(rejected.body.product).toMatchObject({ status: 'rejected', rejectionReason: 'Please add a clear photo of the label.' });
  });
});

const applicationBody = { displayName: 'Asha Closet', legalName: 'Asha Rao', address: { line1: '12 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001' }, agreementAccepted: true };
async function register(email: string) {
  const response = await apiPost('/api/v1/auth/register').send({ name: 'Test User', email, password: 'secure-password-123' });
  if (response.status !== 201) throw new Error(`Test registration failed (${response.status}): ${JSON.stringify(response.body)}`);
  return { id: response.body.user.id as string, cookie: response.headers['set-cookie'] as string };
}
async function makeSeller(email: string) {
  const account = await register(email);
  const application = await apiPost('/api/v1/seller/apply').set('Cookie', account.cookie).send(applicationBody);
  const admin = await makeAdmin(`${email.split('@')[0]}.admin@example.com`);
  const approved = await apiPost(`/api/v1/admin/sellers/${application.body.application._id}/approve`).set('Cookie', admin.cookie).send({});
  expect(approved.status).toBe(200);
  return account;
}
async function makeAdmin(email: string) {
  const passwordHash = await bcrypt.hash('secure-password-123', 4);
  const user = await User.create({ name: 'Test Admin', email, passwordHash, role: 'admin' });
  const response = await apiPost('/api/v1/auth/login').send({ email, password: 'secure-password-123' });
  return { id: user.id, cookie: response.headers['set-cookie'] as string };
}
