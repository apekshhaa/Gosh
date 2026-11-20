import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './db/connect.js';
import { startInventoryRecoveryWorker } from './workers/inventoryRecovery.js';

try {
  await connectDatabase(env.MONGODB_URI);
  startInventoryRecoveryWorker();
  app.listen(env.PORT, () => { console.log(`Marketplace API listening on port ${env.PORT}`); });
} catch (error) {
  console.error('Unable to start API: database connection failed');
  process.exitCode = 1;
}
