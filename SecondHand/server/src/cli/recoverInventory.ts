import { connectDatabase } from '../db/connect.js';
import { env } from '../config/env.js';
import { recoverExpiredReservations } from '../orders/inventory.js';

try {
  await connectDatabase(env.MONGODB_URI);
  const result = await recoverExpiredReservations(1000);
  console.info(JSON.stringify({ event: 'inventory_recovery_complete', ...result }));
  process.exitCode = 0;
} catch (error) {
  console.error(JSON.stringify({ event: 'inventory_recovery_failed', error: error instanceof Error ? error.message : 'unknown' }));
  process.exitCode = 1;
} finally {
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
}
