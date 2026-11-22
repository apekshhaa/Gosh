import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { SellerProfile } from '../src/models/SellerProfile.js';
import { Product } from '../src/models/Product.js';

let mongo: MongoMemoryReplSet;
beforeAll(async () => { mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } }); await mongoose.connect(mongo.getUri()); });
afterEach(async () => { await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))); });
afterAll(async () => { await mongoose.disconnect(); await mongo.stop(); });

const post = (path: string) => request(app).post(path).set('Origin', 'http://localhost:3000');

describe('admin dashboard APIs', () => {
  it('protects overview and users and excludes password/session secrets', async () => {
    const buyer = await register('dashboard-buyer@example.com');
    const admin = await makeAdmin('dashboard-admin@example.com');
    expect((await request(app).get('/api/v1/admin/overview')).status).toBe(401);
    expect((await request(app).get('/api/v1/admin/overview').set('Cookie', buyer.cookie)).status).toBe(403);
    const overview = await request(app).get('/api/v1/admin/overview').set('Cookie', admin.cookie);
    const users = await request(app).get('/api/v1/admin/users').set('Cookie', admin.cookie);
    expect(overview.status).toBe(200);
    expect(overview.body.paymentProvider).toBe('disabled');
    expect(overview.body.finance).toMatchObject({ commissionRateBps: 500, sellerShareRateBps: 9500, buyerMarketplaceFeePaise: 0 });
    expect(users.status).toBe(200);
    expect(users.body.users[0]).not.toHaveProperty('passwordHash');
    expect(users.body.users[0]).not.toHaveProperty('sessionVersion');
  });

  it('suspends and reinstates an approved seller and invalidates their session', async () => {
    const seller = await register('dashboard-seller@example.com');
    const profile = await SellerProfile.create({ user: seller.id, displayName: 'Dashboard Closet', legalName: 'Seller Rao', address: { line1: '12 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001' }, status: 'approved', agreementVersion: 'v1', agreementAcceptedAt: new Date() });
    await User.updateOne({ _id: seller.id }, { $set: { role: 'seller' } });
    const admin = await makeAdmin('suspension-admin@example.com');
    const suspended = await post(`/api/v1/admin/sellers/${profile.id}/suspend`).set('Cookie', admin.cookie).send({ reason: 'Repeated listing policy violations.' });
    expect(suspended.status).toBe(200);
    expect((await User.findById(seller.id))?.status).toBe('suspended');
    expect((await request(app).get('/api/v1/users/me').set('Cookie', seller.cookie)).status).toBe(401);
    const reinstated = await post(`/api/v1/admin/sellers/${profile.id}/reinstate`).set('Cookie', admin.cookie).send({});
    expect(reinstated.status).toBe(200);
    expect((await User.findById(seller.id))?.status).toBe('active');
  });

  it('returns pending product moderation data only to admins', async () => {
    const seller = await register('dashboard-product-seller@example.com');
    await User.updateOne({ _id: seller.id }, { $set: { role: 'seller' } });
    await Product.create({ seller: seller.id, title: 'Review jacket', description: 'A carefully described review jacket.', category: 'womens', size: 'M', condition: 'excellent', pricePaise: 10000, status: 'pending_review' });
    const admin = await makeAdmin('moderation-dashboard-admin@example.com');
    const response = await request(app).get('/api/v1/admin/products?status=pending_review').set('Cookie', admin.cookie);
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.products[0].title).toBe('Review jacket');
  });
});

async function register(email: string) {
  const response = await post('/api/v1/auth/register').send({ name: 'Dashboard User', email, password: 'secure-password-123' });
  return { id: response.body.user.id as string, cookie: response.headers['set-cookie'] as string };
}
async function makeAdmin(email: string) {
  const passwordHash = await bcrypt.hash('secure-password-123', 4);
  const user = await User.create({ name: 'Dashboard Admin', email, passwordHash, role: 'admin' });
  const response = await post('/api/v1/auth/login').send({ email, password: 'secure-password-123' });
  return { id: user.id, cookie: response.headers['set-cookie'] as string };
}
