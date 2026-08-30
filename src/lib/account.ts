export type AccountTransaction = {
  id: string;
  item: string;
  amount: number | null;
  currency: string;
  at: string;
  status: string;
  href?: string | null;
};

export type AccountSubscription = {
  id: string;
  name: string;
  status: string;
  since?: string | null;
  href?: string | null;
};

export function isSubscriptionPackageName(name: string) {
  return /membership|subscription|vip|\b(bronze|silver|gold|platinum)\b/i.test(name);
}

export function sameAccount(left?: string | number | null, right?: string | number | null) {
  if (left == null || right == null) return false;
  return String(left).trim().toLowerCase() === String(right).trim().toLowerCase();
}

export function paymentStatusLabel(raw: string | number | null | undefined) {
  if (typeof raw === "number") {
    if (raw === 1) return "Complete";
    if (raw === 2) return "Refund";
    return "Pending";
  }
  const value = String(raw ?? "Complete").trim();
  if (!value) return "Complete";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function mergeTransactions(rows: AccountTransaction[]) {
  const map = new Map<string, AccountTransaction>();
  for (const row of rows) {
    const current = map.get(row.id);
    if (!current) {
      map.set(row.id, row);
      continue;
    }
    map.set(row.id, {
      ...current,
      ...row,
      item: row.item && row.item !== "Purchase" ? row.item : current.item,
      amount: row.amount ?? current.amount,
      href: row.href ?? current.href,
    });
  }
  return [...map.values()].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
