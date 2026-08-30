export type PurchaseAction = "purchased" | "subscribed" | "resubscribed";

export type RecentPurchase = {
  id: string;
  buyer: string;
  item: string;
  at: string;
  href?: string | null;
  packageId?: number | null;
  quantity?: number;
  action?: PurchaseAction;
  rank?: number | null;
};

export function purchaseVerb(action?: PurchaseAction) {
  if (action === "subscribed") return "subscribed to";
  if (action === "resubscribed") return "resubscribed to";
  return "purchased";
}

export const ANON_BUYER = "Someone";

export function normalizePackageName(name: string) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function formatTimeAgo(iso: string) {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
