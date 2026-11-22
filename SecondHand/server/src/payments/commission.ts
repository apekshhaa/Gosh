export const SELLER_COMMISSION_BPS = 500;
export const SELLER_SHARE_BPS = 9_500;
export const BUYER_MARKETPLACE_FEE_BPS = 0;
export const COMMISSION_DENOMINATOR = 10_000;

export type CommissionSplit = {
  rateBps: number;
  eligibleSubtotalPaise: number;
  sellerCommissionPaise: number;
  sellerSharePaise: number;
  buyerMarketplaceFeePaise: number;
  /** Backward-compatible alias for persisted historical and reconciliation fields. */
  platformCommissionPaise: number;
};

/** Apply the seller-only 5% commission to the discounted merchandise subtotal; ties round half up in paise. */
export function calculateCommission(itemSubtotalPaise: number, discountsPaise = 0, rateBps = SELLER_COMMISSION_BPS): CommissionSplit {
  if (!Number.isSafeInteger(itemSubtotalPaise) || itemSubtotalPaise < 0 || !Number.isSafeInteger(discountsPaise) || discountsPaise < 0 || discountsPaise > itemSubtotalPaise || !Number.isSafeInteger(rateBps) || rateBps < 0 || rateBps > COMMISSION_DENOMINATOR) {
    throw new RangeError('Invalid integer-paise commission inputs');
  }
  const eligibleSubtotalPaise = itemSubtotalPaise - discountsPaise;
  const commissionBig = (BigInt(eligibleSubtotalPaise) * BigInt(rateBps) + BigInt(COMMISSION_DENOMINATOR / 2)) / BigInt(COMMISSION_DENOMINATOR);
  const sellerCommissionPaise = Number(commissionBig);
  if (!Number.isSafeInteger(sellerCommissionPaise)) throw new RangeError('Commission amount exceeds the safe integer range');
  return {
    rateBps,
    eligibleSubtotalPaise,
    sellerCommissionPaise,
    sellerSharePaise: eligibleSubtotalPaise - sellerCommissionPaise,
    buyerMarketplaceFeePaise: BUYER_MARKETPLACE_FEE_BPS === 0 ? 0 : Math.floor(eligibleSubtotalPaise * BUYER_MARKETPLACE_FEE_BPS / COMMISSION_DENOMINATOR),
    platformCommissionPaise: sellerCommissionPaise,
  };
}
