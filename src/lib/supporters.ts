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
import { lookupPlayerNames, parseFiveMId } from "@/lib/player-lookup";
import { getAllPackages, getSidebarRecentPayments } from "@/lib/tebex";

export const TOP_SUPPORTERS_LIMIT = 100;

export type PublicSupporter = {
  rank: number;
  id: string;
  name: string | null;
};

type RankedSpender = {
  key: string;
  id: string;
  total: number;
};

function supporterDisplayId(id?: string | number | null, uuid?: string | null) {
  const raw =
    id != null && String(id).trim()
      ? String(id).trim()
      : uuid?.trim() || "";
  if (!raw || raw.includes("@")) return null;

  const cleaned = raw.replace(/[^\p{L}\p{N}._\-:]/gu, "").trim();
  if (!cleaned) return null;
  if (/^\d+$/.test(cleaned)) return `#${cleaned}`;
  if (cleaned.length > 24) return `${cleaned.slice(0, 22)}…`;
  return cleaned;
}

function isCompleteStatus(status?: string | null) {
  return (status ?? "complete").toLowerCase() === "complete";
}

function playerKey(id?: string | number | null, uuid?: string | null) {
  const uuidKey = uuid?.trim();
  if (uuidKey) return `uuid:${uuidKey.toLowerCase()}`;
  if (id != null && String(id).trim()) return `id:${String(id).trim().toLowerCase()}`;
  return null;
}

function preferId(current: string, next: string) {
  const currentNumeric = current.startsWith("#");
  const nextNumeric = next.startsWith("#");
  if (nextNumeric && !currentNumeric) return next;
  return current;
}

function addSpend(map: Map<string, RankedSpender>, key: string, id: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  const current = map.get(key);
  if (current) {
    current.total += amount;
    current.id = preferId(current.id, id);
    return;
  }
  map.set(key, { key, id, total: amount });
}

function fromPluginPayments(payments: TebexPayment[]) {
  const map = new Map<string, RankedSpender>();

  for (const payment of payments) {
    if (!isCompleteStatus(payment.status)) continue;
    const id = supporterDisplayId(payment.player?.id, payment.player?.uuid);
    if (!id) continue;
    const key = playerKey(payment.player?.id, payment.player?.uuid);
    if (!key) continue;
    const currency = payment.currency?.iso_4217 ?? "USD";
    const amount = convertAmount(Number(payment.amount), currency, "USD", FALLBACK_USD_RATES);
    addSpend(map, key, id, amount);
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
    const id = supporterDisplayId(row.usernameId);
    if (!id) continue;
    const key = playerKey(row.usernameId);
    if (!key) continue;
    const amount = convertAmount(Number(row.total), row.currency || "USD", "USD", FALLBACK_USD_RATES);
    addSpend(map, key, id, amount);
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
    const id = supporterDisplayId(payment.username_id);
    if (!id) continue;
    const key = playerKey(payment.username_id);
    if (!key) continue;
    const needle = normalizePackageName(payment.package?.name ?? "");
    const pkg = catalog.find(
      (item) =>
        (payment.package?.id && item.id === payment.package.id) ||
        (needle && normalizePackageName(item.name) === needle)
    );
    addSpend(map, key, id, pkg?.total_price || 1);
  }

  return map;
}

function toPublicList(map: Map<string, RankedSpender>): PublicSupporter[] {
  return [...map.values()]
    .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id))
    .slice(0, TOP_SUPPORTERS_LIMIT)
    .map((supporter, index) => ({
      rank: index + 1,
      id: supporter.id,
      name: null,
    }));
}

async function withPlayerNames(supporters: PublicSupporter[]): Promise<PublicSupporter[]> {
  if (!supporters.length) return supporters;
  const names = await lookupPlayerNames(supporters.map((supporter) => supporter.id));
  return supporters.map((supporter) => ({
    ...supporter,
    name: names.get(parseFiveMId(supporter.id) ?? -1) ?? null,
  }));
}

export async function getTopSupporters(): Promise<PublicSupporter[]> {
  if (isAdminApiConfigured()) {
    try {
      const ranked = toPublicList(fromPluginPayments(await listPaymentsHistory()));
      if (ranked.length) return withPlayerNames(ranked);
    } catch (error) {
      console.error("top supporters:", error);
    }
  }

  try {
    const fromOrders = toPublicList(await fromDatabase());
    if (fromOrders.length) return withPlayerNames(fromOrders);
  } catch (error) {
    console.error("top supporters database:", error);
  }

  try {
    return withPlayerNames(toPublicList(await fromRecentSidebar()));
  } catch (error) {
    console.error("top supporters sidebar:", error);
    return [];
  }
}
