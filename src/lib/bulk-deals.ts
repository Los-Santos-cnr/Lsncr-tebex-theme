import { isGiftcardName } from "./package-kind";

export type BulkDeal = {
  quantity: number;
  percentOff: number;
  badge: string | null;
};

/** Volume deals for giftable tokens and similar one-off packs. */
export const BULK_DEALS: BulkDeal[] = [
  { quantity: 1, percentOff: 0, badge: null },
  { quantity: 3, percentOff: 10, badge: "Popular" },
  { quantity: 6, percentOff: 25, badge: "Best value" },
];

function money(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function packageOffersBulkDeals(pkg: {
  name?: string | null;
  type?: string | null;
  disable_quantity?: boolean;
  disableQuantity?: boolean;
}) {
  if (pkg.disable_quantity || pkg.disableQuantity) return false;
  if (pkg.type === "subscription") return false;
  if (isGiftcardName(pkg.name)) return false;
  if (/unlock:|unban/i.test(pkg.name ?? "")) return false;
  return /token|pack/i.test(pkg.name ?? "");
}

export function bulkPercentForQuantity(quantity: number) {
  const qty = Number.isFinite(quantity) ? quantity : 1;
  const match = [...BULK_DEALS]
    .sort((a, b) => b.quantity - a.quantity)
    .find((deal) => deal.percentOff > 0 && qty >= deal.quantity);
  return match?.percentOff ?? 0;
}

export function bulkLineTotal(unitPrice: number, quantity: number, percentOff = bulkPercentForQuantity(quantity)) {
  return money(unitPrice * quantity * (1 - percentOff / 100));
}

export function bulkFullTotal(unitPrice: number, quantity: number) {
  return money(unitPrice * quantity);
}
