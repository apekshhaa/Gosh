import { InventoryTransactionUnavailable, recoverExpiredReservations } from '../orders/inventory.js';

let running = false;
let blocked = false;

export function startInventoryRecoveryWorker(intervalMs = 30_000): ReturnType<typeof setInterval> {
  const run = async () => {
    if (running || blocked) return;
    running = true;
    try {
      const result = await recoverExpiredReservations();
      if (result.released) console.info(JSON.stringify({ event: 'expired_inventory_recovered', ...result }));
      if (result.awaitingProvider) console.warn(JSON.stringify({ event: 'inventory_recovery_waiting_for_provider', orders: result.awaitingProvider }));
    } catch (error) {
      if (error instanceof InventoryTransactionUnavailable) {
        blocked = true;
        console.error(JSON.stringify({ event: 'inventory_recovery_disabled', reason: 'mongodb_replica_set_required' }));
      } else console.error(JSON.stringify({ event: 'inventory_recovery_failed', error: error instanceof Error ? error.name : 'unknown' }));
    } finally { running = false; }
  };
  void run();
  const timer = setInterval(() => { void run(); }, intervalMs);
  timer.unref();
  return timer;
}
