import { desc } from "drizzle-orm";
import { orders } from "../../drizzle/schema";
import { FALLBACK_USD_RATES, convertAmount } from "@/lib/currency";
import { db, ensureOrdersTable, isDatabaseConfigured } from "@/lib/db";
import { normalizePackageName } from "@/lib/recent-purchases";
import {
  isAdminApiConfigured,
  listPaymentsHistory,
  type TebexPayment,
} from "@/lib/tebex-admin";
import { getAllPackages, getSidebarRecentPayments } from "@/lib/tebex";

export const TOP_SUPPORTERS_LIMIT = 100;

export type PublicSupporter = {
  rank: number;
  name: string;
};

type RankedSpender = {
  key: string;
  name: string;
  total: number;
};

function supporterDisplayName(raw?: string | null) {
  if (!raw) return null;
  let name = raw.trim();
  if (name.includes("@")) name = name.split("@")[0] ?? name;
  name = name.replace(/[^\p{L}\p{N}._\- ]/gu, "").trim();
  if (!name) return null;
  if (name.length > 24) return `${name.slice(0, 22)}…`;
  return name;
}

function isCompleteStatus(status?: string | null) {
  return (status ?? "complete").toLowerCase() === "complete";
}

function playerKey(id?: string | number | null, uuid?: string | null, name?: string | null) {
  const uuidKey = uuid?.trim();
  if (uuidKey) return `uuid:${uuidKey.toLowerCase()}`;
  if (id != null && String(id).trim()) return `id:${String(id).trim().toLowerCase()}`;
  const display = supporterDisplayName(name);
  if (display) return `name:${display.toLowerCase()}`;
  return null;
}

function addSpend(map: Map<string, RankedSpender>, key: string, name: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  const current = map.get(key);
  if (current) {
    current.total += amount;
    return;
  }
  map.set(key, { key, name, total: amount });
}

function fromPluginPayments(payments: TebexPayment[]) {
  const map = new Map<string, RankedSpender>();

  for (const payment of payments) {
    if (!isCompleteStatus(payment.status)) continue;
    const name = supporterDisplayName(payment.player?.name);
    if (!name) continue;
    const key = playerKey(payment.player?.id, payment.player?.uuid, name);
    if (!key) continue;
    const currency = payment.currency?.iso_4217 ?? "USD";
    const amount = convertAmount(Number(payment.amount), currency, "USD", FALLBACK_USD_RATES);
    addSpend(map, key, name, amount);
  }

  return map;
}

async function fromDatabase() {
  const map = new Map<string, RankedSpender>();
  if (!isDatabaseConfigured()) return map;

  await ensureOrdersTable();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(4000);

  for (const row of rows) {
    if (!isCompleteStatus(row.status)) continue;
    const name = supporterDisplayName(row.username);
    if (!name) continue;
    const key = playerKey(row.usernameId, null, name);
    if (!key) continue;
    const amount = convertAmount(Number(row.total), row.currency || "USD", "USD", FALLBACK_USD_RATES);
    addSpend(map, key, name, amount);
  }

  return map;
}

async function fromRecentSidebar() {
  const map = new Map<string, RankedSpender>();
  const [payments, catalog] = await Promise.all([
    getSidebarRecentPayments().catch(() => []),
    getAllPackages().catch(() => []),
  ]);

  for (const payment of payments) {
    const name = supporterDisplayName(payment.username);
    if (!name) continue;
    const key = playerKey(payment.username_id, null, name);
    if (!key) continue;
    const needle = normalizePackageName(payment.package?.name ?? "");
    const pkg = catalog.find(
      (item) =>
        (payment.package?.id && item.id === payment.package.id) ||
        (needle && normalizePackageName(item.name) === needle)
    );
    addSpend(map, key, name, pkg?.total_price || 1);
  }

  return map;
}

function toPublicList(map: Map<string, RankedSpender>): PublicSupporter[] {
  return [...map.values()]
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, TOP_SUPPORTERS_LIMIT)
    .map((supporter, index) => ({
      rank: index + 1,
      name: supporter.name,
    }));
}

export async function getTopSupporters(): Promise<PublicSupporter[]> {
  if (isAdminApiConfigured()) {
    try {
      const ranked = toPublicList(fromPluginPayments(await listPaymentsHistory()));
      if (ranked.length) return ranked;
    } catch (error) {
      console.error("top supporters:", error);
    }
  }

  try {
    const fromOrders = toPublicList(await fromDatabase());
    if (fromOrders.length) return fromOrders;
  } catch (error) {
    console.error("top supporters database:", error);
  }

  try {
    return toPublicList(await fromRecentSidebar());
  } catch (error) {
    console.error("top supporters sidebar:", error);
    return [];
  }
}
