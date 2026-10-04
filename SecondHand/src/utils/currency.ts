/** Format amounts in Indian Rupees with en-IN grouping */
export function formatINR(amount: number, showDecimals = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export const EXPRESS_SHIPPING_INR = 1250;
export const FREE_SHIPPING_THRESHOLD_INR = 16600;
