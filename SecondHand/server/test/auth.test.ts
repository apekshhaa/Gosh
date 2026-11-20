import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { SellerProfile } from '../src/models/SellerProfile.js';
import { Product } from '../src/models/Product.js';

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

const apiPost = (path: string) => request(app).post(path).set('Origin', 'http://localhost:3000');
const applicationBody = {
  displayName: 'Asha’s Closet',
  legalName: 'Asha Rao',
  address: { line1: '12 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
  agreementAccepted: true,
};

describe('authentication', () => {
  it('registers a user with a hashed password and buyer defaults', async () => {
    const response = await apiPost('/api/v1/auth/register').send({ name: 'Asha Rao', email: 'ASHA@example.com', password: 'secure-password-123' });
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ name: 'Asha Rao', email: 'asha@example.com', role: 'buyer', status: 'active', emailVerified: false, phoneVerified: false });
    const cookie = response.headers['set-cookie'][0] as string;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Max-Age=604800');
    const token = cookie.match(/gosh_session=([^;]+)/)?.[1];
    const claims = token ? jwt.decode(token) as { iat: number; exp: number } : undefined;
    expect(claims && claims.exp - claims.iat).toBe(7 * 24 * 60 * 60);
    const stored = await User.findOne({ email: 'asha@example.com' }).select('+passwordHash');
    expect(stored?.passwordHash).not.toBe('secure-password-123');
  });

  it('ignores attempted admin role assignment at registration', async () => {
    const response = await apiPost('/api/v1/auth/register').send({ name: 'Asha Rao', email: 'asha@example.com', password: 'secure-password-123', role: 'admin' });
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('buyer');
  });

  it('rejects unsafe requests without the configured origin', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({ name: 'Asha Rao', email: 'asha@example.com', password: 'secure-password-123' });
    expect(response.status).toBe(403);
  });

  it('logs in and rejects invalid credentials', async () => {
    await apiPost('/api/v1/auth/register').send({ name: 'Asha Rao', email: 'asha@example.com', password: 'secure-password-123' });
    const ok = await apiPost('/api/v1/auth/login').send({ email: 'ASHA@example.com', password: 'secure-password-123' });
    const bad = await apiPost('/api/v1/auth/login').send({ email: 'asha@example.com', password: 'incorrect-password' });
    expect(ok.status).toBe(200);
    expect(ok.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(bad.status).toBe(401);
    expect(bad.body.error).toBe('Invalid email or password');
  });

  it('requires authentication for current user and returns the signed-in user', async () => {
    const anon = await request(app).get('/api/v1/users/me');
    expect(anon.status).toBe(401);
    const registered = await apiPost('/api/v1/auth/register').send({ name: 'Asha Rao', email: 'asha@example.com', password: 'secure-password-123' });
    const me = await request(app).get('/api/v1/users/me').set('Cookie', registered.headers['set-cookie']);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('asha@example.com');
  });

  it('rejects duplicate registrations', async () => {
    await apiPost('/api/v1/auth/register').send({ name: 'Asha Rao', email: 'asha@example.com', password: 'secure-password-123' });
    const duplicate = await apiPost('/api/v1/auth/register').send({ name: 'Asha Rao', email: 'asha@example.com', password: 'secure-password-123' });
    expect(duplicate.status).toBe(409);
  });

  it('logs out, clears the cookie, and invalidates the session token', async () => {
    const registered = await apiPost('/api/v1/auth/register').send({ name: 'Asha Rao', email: 'asha@example.com', password: 'secure-password-123' });
    const cookie = registered.headers['set-cookie'] as string;
    const response = await apiPost('/api/v1/auth/logout').set('Cookie', cookie);
    expect(response.status).toBe(204);
    expect(response.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
    const oldSession = await request(app).get('/api/v1/users/me').set('Cookie', cookie);
    expect(oldSession.status).toBe(401);
  });
});

describe('marketplace schemas and authorization', () => {
  it('creates an authenticated pending seller application with server-controlled agreement data', async () => {
    const { cookie } = await register('apply@example.com');
    const response = await apiPost('/api/v1/seller/apply').set('Cookie', cookie).send({ ...applicationBody, role: 'admin' });
    expect(response.status).toBe(400);
    const applied = await apiPost('/api/v1/seller/apply').set('Cookie', cookie).send(applicationBody);
    expect(applied.status).toBe(201);
    expect(applied.body.application).toMatchObject({ displayName: 'Asha’s Closet', legalName: 'Asha Rao', status: 'pending', agreementVersion: 'v1' });
    expect(applied.body.application.agreementAcceptedAt).toBeTruthy();
    expect((await User.findOne({ email: 'apply@example.com' }))?.role).toBe('buyer');
    const status = await request(app).get('/api/v1/seller/me').set('Cookie', cookie);
    expect(status.status).toBe(200);
    expect(status.body.application.status).toBe('pending');
  });

  it('rejects duplicate active applications and invalid or unaccepted fields', async () => {
    const { cookie } = await register('duplicate-application@example.com');
    const first = await apiPost('/api/v1/seller/apply').set('Cookie', cookie).send(applicationBody);
    const duplicate = await apiPost('/api/v1/seller/apply').set('Cookie', cookie).send(applicationBody);
    expect(first.status).toBe(201);
    expect(duplicate.status).toBe(409);
    expect(await SellerProfile.countDocuments({ user: (await User.findOne({ email: 'duplicate-application@example.com' }))?._id })).toBe(1);
    const invalid = await apiPost('/api/v1/seller/apply').set('Cookie', cookie).send({ ...applicationBody, agreementAccepted: false });
    expect(invalid.status).toBe(400);
  });

  it('protects admin application review endpoints from anonymous and buyer access', async () => {
    const anonymousList = await request(app).get('/api/v1/admin/sellers');
    const { cookie } = await register('not-admin@example.com');
    const buyerList = await request(app).get('/api/v1/admin/sellers').set('Cookie', cookie);
    const buyerApprove = await apiPost(`/api/v1/admin/sellers/${new mongoose.Types.ObjectId()}/approve`).set('Cookie', cookie);
    expect(anonymousList.status).toBe(401);
    expect(buyerList.status).toBe(403);
    expect(buyerApprove.status).toBe(403);
  });

  it('lets an admin approve an application and unlocks only that approved seller', async () => {
    const { user, cookie: sellerCookie } = await register('approved@example.com');
    const application = await apiPost('/api/v1/seller/apply').set('Cookie', sellerCookie).send(applicationBody);
    const adminCookie = await createAdmin('reviewer@example.com');
    const adminList = await request(app).get('/api/v1/admin/sellers?status=pending').set('Cookie', adminCookie);
    expect(adminList.status).toBe(200);
    expect(adminList.body.total).toBe(1);
    const maliciousApprove = await apiPost(`/api/v1/admin/sellers/${application.body.application._id}/approve`).set('Cookie', adminCookie).send({ role: 'admin' });
    expect(maliciousApprove.status).toBe(400);
    const approved = await apiPost(`/api/v1/admin/sellers/${application.body.application._id}/approve`).set('Cookie', adminCookie);
    expect(approved.status).toBe(200);
    expect(approved.body.application.status).toBe('approved');
    expect(approved.body.application.reviewedBy).toBeTruthy();
    expect((await User.findById(user.id))?.role).toBe('seller');
    const product = await Product.create({ seller: user.id, title: 'Pre-loved cotton shirt', description: 'A clean and carefully worn cotton shirt.', category: 'tops', size: 'M', condition: 'excellent', pricePaise: 125000 });
    const sellerRead = await request(app).get(`/api/v1/seller/products/${product.id}`).set('Cookie', sellerCookie);
    expect(sellerRead.status).toBe(200);
  });

  it('lets an admin reject an application with a reason and permits later resubmission', async () => {
    const { cookie } = await register('rejected@example.com');
    const application = await apiPost('/api/v1/seller/apply').set('Cookie', cookie).send(applicationBody);
    const adminCookie = await createAdmin('rejector@example.com');
    const rejected = await apiPost(`/api/v1/admin/sellers/${application.body.application._id}/reject`).set('Cookie', adminCookie).send({ reason: 'Please provide a clearer seller display name.' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.application).toMatchObject({ status: 'rejected', rejectionReason: 'Please provide a clearer seller display name.' });
    expect(rejected.body.application.reviewedBy).toBeTruthy();
    expect((await User.findOne({ email: 'rejected@example.com' }))?.role).toBe('buyer');
    const reapplied = await apiPost('/api/v1/seller/apply').set('Cookie', cookie).send(applicationBody);
    expect(reapplied.status).toBe(201);
    expect(reapplied.body.application.status).toBe('pending');
    expect(reapplied.body.application.rejectionReason).toBeUndefined();
  });

  it('denies product access to a seller-role account with a pending application', async () => {
    const { user, cookie } = await register('pending-seller@example.com');
    await apiPost('/api/v1/seller/apply').set('Cookie', cookie).send(applicationBody);
    await User.updateOne({ _id: user.id }, { $set: { role: 'seller' } });
    const product = await Product.create({ seller: user.id, title: 'Pre-loved cotton shirt', description: 'A clean and carefully worn cotton shirt.', category: 'tops', size: 'M', condition: 'excellent', pricePaise: 125000 });
    const response = await request(app).get(`/api/v1/seller/products/${product.id}`).set('Cookie', cookie);
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('approved seller application');
  });

  it('defaults a seller application to pending', async () => {
    const user = await User.create({ name: 'Seller', email: 'seller@example.com', passwordHash: 'hashed', role: 'seller' });
    const profile = await SellerProfile.create({ user: user.id, displayName: 'Seller Closet', legalName: 'Seller Rao', address: { line1: '1 Main Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001' }, agreementVersion: 'v1', agreementAcceptedAt: new Date() });
    expect(profile.status).toBe('pending');
  });

  it('defaults product inventory to one and validates integer paise', async () => {
    const user = await User.create({ name: 'Seller', email: 'seller@example.com', passwordHash: 'hashed', role: 'seller' });
    const attrs = { seller: user.id, title: 'Pre-loved cotton shirt', description: 'A clean and carefully worn cotton shirt.', category: 'tops', size: 'M', condition: 'excellent', pricePaise: 125000 };
    const product = await Product.create(attrs);
    expect(product.inventory).toBe(1);
    await expect(new Product({ ...attrs, pricePaise: 12.5 }).validate()).rejects.toThrow();
    await expect(new Product({ ...attrs, pricePaise: 125000, inventory: 0 }).validate()).rejects.toThrow();
  });

  it('blocks unauthenticated access and sellers from another seller’s product', async () => {
    const passwordHash = await (await import('bcryptjs')).default.hash('secure-password-123', 4);
    const owner = await User.create({ name: 'Owner', email: 'owner@example.com', passwordHash, role: 'seller' });
    const outsider = await User.create({ name: 'Other', email: 'other@example.com', passwordHash, role: 'seller' });
    await createApprovedSellerProfile(owner.id);
    await createApprovedSellerProfile(outsider.id);
    const product = await Product.create({ seller: owner.id, title: 'Pre-loved cotton shirt', description: 'A clean and carefully worn cotton shirt.', category: 'tops', size: 'M', condition: 'excellent', pricePaise: 125000 });
    const anonymous = await request(app).get(`/api/v1/seller/products/${product.id}`);
    expect(anonymous.status).toBe(401);
    const outsiderCookie = await loginAs(outsider.email);
    const ownerCookie = await loginAs(owner.email);
    const forbidden = await request(app).get(`/api/v1/seller/products/${product.id}`).set('Cookie', outsiderCookie);
    const allowed = await request(app).get(`/api/v1/seller/products/${product.id}`).set('Cookie', ownerCookie);
    expect(forbidden.status).toBe(403);
    expect(allowed.status).toBe(200);
    expect(allowed.body.product._id).toBe(product.id);
  });
});

async function loginAs(email: string) {
  const response = await apiPost('/api/v1/auth/login').send({ email, password: 'secure-password-123' });
  return response.headers['set-cookie'] as string;
}

async function register(email: string) {
  const response = await apiPost('/api/v1/auth/register').send({ name: 'Test Applicant', email, password: 'secure-password-123' });
  return { user: response.body.user as { id: string }, cookie: response.headers['set-cookie'] as string };
}

async function createAdmin(email: string) {
  const passwordHash = await (await import('bcryptjs')).default.hash('secure-password-123', 4);
  await User.create({ name: 'Test Admin', email, passwordHash, role: 'admin' });
  return loginAs(email);
}

async function createApprovedSellerProfile(userId: string) {
  return SellerProfile.create({
    user: userId,
    displayName: 'Approved Closet',
    legalName: 'Approved Seller',
    address: { line1: '12 Market Road', city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
    agreementVersion: 'v1',
    agreementAcceptedAt: new Date(),
    status: 'approved',
  });
}
