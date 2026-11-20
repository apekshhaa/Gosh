import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { Order } from '../src/models/Order.js';
import { Product } from '../src/models/Product.js';
import { InventoryTransactionUnavailable, assertReplicaSetTransactions, inTransaction, recoverExpiredReservations, releaseExpiredReservation } from '../src/orders/inventory.js';

beforeAll(async () => {
  const uri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/gosh_marketplace_test';
  if (!new URL(uri).pathname.slice(1).endsWith('_test')) throw new Error('MONGODB_TEST_URI must use a database name ending in _test');
  await mongoose.connect(uri);
});
afterEach(async () => { await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({}))); });
afterAll(async () => { await mongoose.disconnect(); });

describe('inventory transaction guard', () => {
  it('does not invoke transaction work unless MongoDB advertises replica-set transactions', async () => {
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (hello.setName) {
      let entered = false;
      await expect(inTransaction(async () => { entered = true; throw new Error('injected transaction failure'); })).rejects.toThrow('injected transaction failure');
      expect(entered).toBe(true);
    } else {
      let entered = false;
      await expect(inTransaction(async () => { entered = true; })).rejects.toBeInstanceOf(InventoryTransactionUnavailable);
      expect(entered).toBe(false);
      await expect(assertReplicaSetTransactions()).rejects.toBeInstanceOf(InventoryTransactionUnavailable);
    }
  });

  it('does not release stock or mutate expired orders when transaction support is unavailable', async () => {
    const seller = new mongoose.Types.ObjectId();
    const product = await Product.create({ seller, title: 'Inventory test jacket', description: 'A test listing with a detailed enough description.', category: 'womens', size: 'M', condition: 'excellent', pricePaise: 10000, inventory: 1, status: 'approved' });
    await Product.updateOne({ _id: product._id }, { $inc: { inventory: -1 } });
    const order = await Order.create({ orderNumber: `GSH-${new mongoose.Types.ObjectId().toString()}`, buyer: new mongoose.Types.ObjectId(), seller, idempotencyKey: 'expiry-test-0001', requestHash: 'test-hash', items: [{ product: product._id, title: product.title, quantity: 1, unitPricePaise: 10000 }], itemSubtotalPaise: 10000, shippingPaise: 0, discountsPaise: 0, taxesPaise: 0, totalPaise: 10000, commissionRateBps: 2000, commissionBasisPaise: 10000, platformCommissionPaise: 2000, sellerSharePaise: 8000, reservationExpiresAt: new Date(Date.now() - 1000) });
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (hello.setName) return;
    await expect(releaseExpiredReservation(order._id)).rejects.toBeInstanceOf(InventoryTransactionUnavailable);
    await expect(recoverExpiredReservations()).rejects.toBeInstanceOf(InventoryTransactionUnavailable);
    expect((await Product.findById(product._id))?.inventory).toBe(0);
    expect((await Order.findById(order._id))?.inventoryReleasedAt).toBeNull();
  });

  it('rolls stock changes back on transaction failure and releases an expired reservation exactly once', async () => {
    const seller = new mongoose.Types.ObjectId();
    const product = await Product.create({ seller, title: 'Recovery test skirt', description: 'A recovery test listing with a detailed enough description.', category: 'womens', size: 'S', condition: 'excellent', pricePaise: 12000, inventory: 1, status: 'approved' });
    const hello = await mongoose.connection.db!.admin().command({ hello: 1 });
    if (!hello.setName) {
      await expect(inTransaction(async (session) => { await Product.updateOne({ _id: product._id }, { $inc: { inventory: -1 } }, { session }); })).rejects.toBeInstanceOf(InventoryTransactionUnavailable);
      expect((await Product.findById(product._id))?.inventory).toBe(1);
      return;
    }

    await expect(inTransaction(async (session) => {
      await Product.updateOne({ _id: product._id }, { $inc: { inventory: -1 } }, { session });
      throw new Error('injected failure after reservation');
    })).rejects.toThrow('injected failure after reservation');
    expect((await Product.findById(product._id))?.inventory).toBe(1);

    await Product.updateOne({ _id: product._id }, { $inc: { inventory: -1 } });
    const order = await makeExpiredOrder(product._id, seller);
    const results = await Promise.all([releaseExpiredReservation(order._id), releaseExpiredReservation(order._id)]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await Product.findById(product._id))?.inventory).toBe(1);
    expect((await Order.findById(order._id))?.inventoryReleasedAt).toBeInstanceOf(Date);
    expect(await releaseExpiredReservation(order._id)).toBe(false);
  });
});

async function makeExpiredOrder(productId: mongoose.Types.ObjectId, seller: mongoose.Types.ObjectId) {
  return Order.create({ orderNumber: `GSH-${new mongoose.Types.ObjectId().toString()}`, buyer: new mongoose.Types.ObjectId(), seller, idempotencyKey: 'concurrent-expiry-0001', requestHash: 'test-hash', items: [{ product: productId, title: 'Recovery test skirt', quantity: 1, unitPricePaise: 12000 }], itemSubtotalPaise: 12000, shippingPaise: 0, discountsPaise: 0, taxesPaise: 0, totalPaise: 12000, commissionRateBps: 2000, commissionBasisPaise: 12000, platformCommissionPaise: 2400, sellerSharePaise: 9600, reservationExpiresAt: new Date(Date.now() - 1000) });
}
