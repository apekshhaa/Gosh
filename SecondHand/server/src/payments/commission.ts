export const PLATFORM_COMMISSION_BPS = 2_000;
export const COMMISSION_DENOMINATOR = 10_000;

export type CommissionSplit = {
  rateBps: number;
  eligibleSubtotalPaise: number;
  platformCommissionPaise: number;
  sellerSharePaise: number;
};

/** Apply 20% to net eligible merchandise subtotal; ties round half up in paise. */
export function calculateCommission(itemSubtotalPaise: number, discountsPaise = 0, rateBps = PLATFORM_COMMISSION_BPS): CommissionSplit {
  if (!Number.isSafeInteger(itemSubtotalPaise) || itemSubtotalPaise < 0 || !Number.isSafeInteger(discountsPaise) || discountsPaise < 0 || discountsPaise > itemSubtotalPaise || !Number.isSafeInteger(rateBps) || rateBps < 0 || rateBps > COMMISSION_DENOMINATOR) {
    throw new RangeError('Invalid integer-paise commission inputs');
  }
  const eligibleSubtotalPaise = itemSubtotalPaise - discountsPaise;
  const commissionBig = (BigInt(eligibleSubtotalPaise) * BigInt(rateBps) + BigInt(COMMISSION_DENOMINATOR / 2)) / BigInt(COMMISSION_DENOMINATOR);
  const platformCommissionPaise = Number(commissionBig);
  if (!Number.isSafeInteger(platformCommissionPaise)) throw new RangeError('Commission amount exceeds the safe integer range');
  return { rateBps, eligibleSubtotalPaise, platformCommissionPaise, sellerSharePaise: eligibleSubtotalPaise - platformCommissionPaise };
}
