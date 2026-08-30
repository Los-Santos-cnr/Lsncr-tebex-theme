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
import { lookupPlayerNames, fivemIdFromTebexPlayer, isPlayerLookupConfigured, parseFiveMId } from "@/lib/player-lookup";
import { getAllPackages, getSidebarRecentPayments } from "@/lib/tebex";

export const TOP_SUPPORTERS_LIMIT = 500;
const TOP_SUPPORTERS_CANDIDATES = 800;

export type PublicSupporter = {
  rank: number;
  id: string;
  name: string | null;
  /** Share of all named supporters on this board, 0–100. Not a currency amount. */
  score: number;
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
    const fivemId = fivemIdFromTebexPlayer(payment.player);
    if (fivemId == null) continue;
    const key = playerKey(fivemId, payment.player?.uuid);
    if (!key) continue;
    const currency = payment.currency?.iso_4217 ?? "USD";
    const amount = convertAmount(Number(payment.amount), currency, "USD", FALLBACK_USD_RATES);
    addSpend(map, key, `#${fivemId}`, amount);
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

function shareOfTotal(total: number, grandTotal: number) {
  if (!Number.isFinite(total) || total <= 0 || !(grandTotal > 0)) return 0;
  return Math.min(100, (100 * total) / grandTotal);
}

function toCandidateList(map: Map<string, RankedSpender>): RankedSpender[] {
  return [...map.values()]
    .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id))
    .slice(0, TOP_SUPPORTERS_CANDIDATES);
}

async function withPlayerNames(spenders: RankedSpender[]): Promise<PublicSupporter[]> {
  if (!spenders.length) return [];

  let picked = spenders;
  let names = new Map<number, string>();

  if (isPlayerLookupConfigured()) {
    names = await lookupPlayerNames(spenders.map((spender) => spender.id));
    picked = spenders.filter((spender) => names.has(parseFiveMId(spender.id) ?? -1));
  }

  picked = picked.slice(0, TOP_SUPPORTERS_LIMIT);
  const grandTotal = picked.reduce((sum, spender) => sum + spender.total, 0);

  return picked.map((spender, index) => ({
    rank: index + 1,
    id: spender.id,
    name: names.get(parseFiveMId(spender.id) ?? -1) ?? null,
    score: shareOfTotal(spender.total, grandTotal),
  }));
}

export async function getTopSupporters(): Promise<PublicSupporter[]> {
  if (isAdminApiConfigured()) {
    try {
      const ranked = toCandidateList(fromPluginPayments(await listPaymentsHistory(80)));
      if (ranked.length) return withPlayerNames(ranked);
    } catch (error) {
      console.error("top supporters:", error);
    }
  }

  try {
    const fromOrders = toCandidateList(await fromDatabase());
    if (fromOrders.length) return withPlayerNames(fromOrders);
  } catch (error) {
    console.error("top supporters database:", error);
  }

  try {
    return withPlayerNames(toCandidateList(await fromRecentSidebar()));
  } catch (error) {
    console.error("top supporters sidebar:", error);
    return [];
  }
}

const RANK_CACHE_MS = 5 * 60 * 1000;
let rankCache: { at: number; ranks: Map<number, number> } | null = null;

export async function getSupporterRanks(): Promise<Map<number, number>> {
  if (rankCache && Date.now() - rankCache.at < RANK_CACHE_MS) return rankCache.ranks;

  const ranks = new Map<number, number>();
  try {
    for (const supporter of await getTopSupporters()) {
      const id = parseFiveMId(supporter.id);
      if (id != null) ranks.set(id, supporter.rank);
    }
    rankCache = { at: Date.now(), ranks };
  } catch (error) {
    console.error("supporter ranks:", error);
  }
  return ranks;
}
