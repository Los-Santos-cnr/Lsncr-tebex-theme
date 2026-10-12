import { desc, eq } from "drizzle-orm";
import { orders, playerDiscordLinks, topSupporterGrants } from "../../drizzle/schema";
import { FALLBACK_USD_RATES, convertAmount } from "./currency";
import { extractDiscordId, parseDiscordSnowflake } from "./discord-ids";
import {
  addGuildMemberRole,
  getTopSupporterRoleId,
  isDiscordRoleSyncConfigured,
  removeGuildMemberRole,
} from "./discord-guild";
import { db, ensureOrdersTable, ensureTopSupporterTables, isDatabaseConfigured } from "./db";
import {
  fivemIdFromTebexPlayer,
  lookupPlayerProfiles,
  parseFiveMId,
} from "./player-lookup";
import {
  isAdminApiConfigured,
  listPaymentsSince,
  lookupPlayer,
  type TebexPayment,
  type TebexPlayerLookup,
} from "./tebex-admin";

export const TOP_SUPPORTER_MIN_USD = 500;
export const TOP_SUPPORTER_WINDOW_DAYS = 90;

export type TopSupporterSyncResult = {
  apply: boolean;
  roleId: string;
  windowDays: number;
  thresholdUsd: number;
  payments: number;
  qualified: number;
  granted: number;
  alreadyHad: number;
  revoked: number;
  skippedNoDiscord: number;
  skippedNotInGuild: number;
  errors: string[];
};

type Spender = {
  fivemId: number;
  usd: number;
  discordId: string | null;
};

function windowStart(now = Date.now()) {
  return new Date(now - TOP_SUPPORTER_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

function toUsd(amount: number, currency?: string | null) {
  return convertAmount(Number(amount) || 0, (currency || "USD").toUpperCase(), "USD", FALLBACK_USD_RATES);
}

function isCompletePayment(status?: string | number | null) {
  if (typeof status === "number") return status === 1;
  return (status ?? "complete").toLowerCase() === "complete";
}

function paymentTimeMs(value: string | number | null | undefined) {
  if (value == null) return 0;
  if (typeof value === "number") return value > 1e12 ? value : value * 1000;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function addSpend(map: Map<number, Spender>, fivemId: number, usd: number, discordId?: string | null) {
  if (!Number.isFinite(usd) || usd <= 0) return;
  const current = map.get(fivemId);
  if (current) {
    current.usd += usd;
    if (!current.discordId && discordId) current.discordId = discordId;
    return;
  }
  map.set(fivemId, { fivemId, usd, discordId: discordId ?? null });
}

export async function persistPlayerDiscordLink(fivemId: number, discordId: string) {
  const id = parseDiscordSnowflake(discordId);
  if (!id || !isDatabaseConfigured()) return;
  await ensureTopSupporterTables();
  await db
    .insert(playerDiscordLinks)
    .values({ fivemId: String(fivemId), discordId: id })
    .onConflictDoUpdate({
      target: playerDiscordLinks.fivemId,
      set: { discordId: id, updatedAt: new Date() },
    });
}

async function loadDiscordLinks() {
  const links = new Map<number, string>();
  if (!isDatabaseConfigured()) return links;
  await ensureTopSupporterTables();
  const rows = await db.select().from(playerDiscordLinks);
  for (const row of rows) {
    const fivemId = parseFiveMId(row.fivemId);
    const discordId = parseDiscordSnowflake(row.discordId);
    if (fivemId == null || !discordId) continue;
    links.set(fivemId, discordId);
  }
  return links;
}

async function loadGrantedDiscordIds() {
  const ids = new Set<string>();
  if (!isDatabaseConfigured()) return ids;
  await ensureTopSupporterTables();
  const rows = await db.select().from(topSupporterGrants);
  for (const row of rows) {
    const id = parseDiscordSnowflake(row.discordId);
    if (id) ids.add(id);
  }
  return ids;
}

async function rememberGrant(discordId: string, fivemId: number, spendUsd: number) {
  if (!isDatabaseConfigured()) return;
  await ensureTopSupporterTables();
  await db
    .insert(topSupporterGrants)
    .values({
      discordId,
      fivemId: String(fivemId),
      spendUsd: spendUsd.toFixed(2),
    })
    .onConflictDoUpdate({
      target: topSupporterGrants.discordId,
      set: { fivemId: String(fivemId), spendUsd: spendUsd.toFixed(2), grantedAt: new Date() },
    });
}

async function forgetGrant(discordId: string) {
  if (!isDatabaseConfigured()) return;
  await ensureTopSupporterTables();
  await db.delete(topSupporterGrants).where(eq(topSupporterGrants.discordId, discordId));
}

function spendFromPluginPayments(payments: TebexPayment[], cutoffMs: number) {
  const map = new Map<number, Spender>();
  for (const payment of payments) {
    if (!isCompletePayment(payment.status)) continue;
    if (paymentTimeMs(payment.date) < cutoffMs) continue;
    const fivemId = fivemIdFromTebexPlayer(payment.player);
    if (fivemId == null) continue;
    addSpend(map, fivemId, toUsd(Number(payment.amount), payment.currency?.iso_4217), extractDiscordId(payment));
  }
  return map;
}

function spendFromLookup(user: TebexPlayerLookup, cutoffMs: number) {
  let usd = 0;
  for (const payment of user.payments ?? []) {
    if (!isCompletePayment(payment.status)) continue;
    if (paymentTimeMs(payment.time) < cutoffMs) continue;
    usd += toUsd(Number(payment.price), payment.currency);
  }
  return usd;
}

async function spendFromOrders(cutoffMs: number) {
  const map = new Map<number, Spender>();
  if (!isDatabaseConfigured()) return map;
  await ensureOrdersTable();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(4000);
  for (const row of rows) {
    if (!isCompletePayment(row.status)) continue;
    const created = row.createdAt ? row.createdAt.getTime() : 0;
    if (created && created < cutoffMs) continue;
    const fivemId = parseFiveMId(row.usernameId);
    if (fivemId == null) continue;
    addSpend(map, fivemId, toUsd(Number(row.total), row.currency), extractDiscordId(row.rawPayload));
  }
  return map;
}

function mergeSpend(target: Map<number, Spender>, extra: Map<number, Spender>) {
  for (const spender of extra.values()) {
    addSpend(target, spender.fivemId, spender.usd, spender.discordId);
  }
}

async function resolveDiscordIds(spenders: Spender[]) {
  const links = await loadDiscordLinks();
  for (const spender of spenders) {
    if (!spender.discordId) spender.discordId = links.get(spender.fivemId) ?? null;
  }

  const missing = spenders.filter((spender) => !spender.discordId).map((spender) => spender.fivemId);
  if (missing.length) {
    const profiles = await lookupPlayerProfiles(missing);
    for (const spender of spenders) {
      if (spender.discordId) continue;
      const profile = profiles.get(spender.fivemId);
      if (profile?.discordId) spender.discordId = profile.discordId;
    }
  }

  for (const spender of spenders) {
    if (spender.discordId) await persistPlayerDiscordLink(spender.fivemId, spender.discordId);
  }
}

async function applyRole(discordId: string, qualify: boolean, apply: boolean) {
  if (!apply) return qualify ? ("granted" as const) : ("revoked" as const);
  return qualify ? addGuildMemberRole(discordId) : removeGuildMemberRole(discordId);
}

export async function syncTopSupporterRoles(options?: { apply?: boolean }): Promise<TopSupporterSyncResult> {
  const apply = options?.apply !== false;
  const result: TopSupporterSyncResult = {
    apply,
    roleId: getTopSupporterRoleId(),
    windowDays: TOP_SUPPORTER_WINDOW_DAYS,
    thresholdUsd: TOP_SUPPORTER_MIN_USD,
    payments: 0,
    qualified: 0,
    granted: 0,
    alreadyHad: 0,
    revoked: 0,
    skippedNoDiscord: 0,
    skippedNotInGuild: 0,
    errors: [],
  };

  if (!isAdminApiConfigured()) {
    result.errors.push("TEBEX_SECRET_KEY is not configured.");
    return result;
  }
  if (apply && !isDiscordRoleSyncConfigured()) {
    result.errors.push("Discord bot token, guild id, and Top Supporter role id are required to apply roles.");
    return result;
  }

  const cutoff = windowStart();
  const cutoffMs = cutoff.getTime();
  const payments = await listPaymentsSince(cutoff, 160);
  result.payments = payments.length;

  const spend = spendFromPluginPayments(payments, cutoffMs);
  const fromOrders = await spendFromOrders(cutoffMs).catch(() => new Map<number, Spender>());
  if (spend.size) {
    for (const extra of fromOrders.values()) {
      const current = spend.get(extra.fivemId);
      if (current && !current.discordId && extra.discordId) current.discordId = extra.discordId;
    }
  } else {
    mergeSpend(spend, fromOrders);
  }

  const spenders = [...spend.values()];
  await resolveDiscordIds(spenders);

  const qualifyers = spenders.filter((spender) => spender.usd >= TOP_SUPPORTER_MIN_USD);
  result.qualified = qualifyers.length;

  const qualifyDiscord = new Set<string>();
  for (const spender of qualifyers) {
    if (!spender.discordId) {
      result.skippedNoDiscord += 1;
      continue;
    }
    qualifyDiscord.add(spender.discordId);
    try {
      const outcome = await applyRole(spender.discordId, true, apply);
      if (outcome === "granted") result.granted += 1;
      else if (outcome === "already") result.alreadyHad += 1;
      else if (outcome === "not_in_guild") result.skippedNotInGuild += 1;
      else if (outcome === "forbidden") result.errors.push("Bot lacks Manage Roles or its role is below Top Supporter.");
      else if (outcome === "error") result.errors.push(`Could not grant role to ${spender.discordId}.`);
      if (apply && (outcome === "granted" || outcome === "already")) {
        await rememberGrant(spender.discordId, spender.fivemId, spender.usd);
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Role grant failed");
    }
  }

  const previous = await loadGrantedDiscordIds();
  for (const discordId of previous) {
    if (qualifyDiscord.has(discordId)) continue;
    try {
      const outcome = await applyRole(discordId, false, apply);
      if (outcome === "revoked" || outcome === "missing") {
        result.revoked += 1;
        if (apply) await forgetGrant(discordId);
      } else if (outcome === "forbidden") {
        result.errors.push("Bot lacks permission to remove Top Supporter.");
      } else if (outcome === "error") {
        result.errors.push(`Could not revoke role from ${discordId}.`);
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Role revoke failed");
    }
  }

  return result;
}

export async function syncTopSupporterForIdentities(input: {
  fivemId?: number | null;
  discordId?: string | null;
}) {
  const fivemId = parseFiveMId(input.fivemId);
  const discordId = parseDiscordSnowflake(input.discordId);
  if (fivemId && discordId) {
    await persistPlayerDiscordLink(fivemId, discordId).catch((error) => {
      console.error("top supporter link:", error);
    });
  }
  if (!isAdminApiConfigured() || !isDiscordRoleSyncConfigured()) return;
  if (fivemId == null) return;

  const cutoffMs = windowStart().getTime();
  let usd = 0;
  try {
    usd = spendFromLookup(await lookupPlayer(String(fivemId)), cutoffMs);
  } catch (error) {
    console.error("top supporter player lookup:", error);
    return;
  }

  let resolvedDiscord = discordId;
  if (!resolvedDiscord) {
    const spender: Spender = { fivemId, usd, discordId: null };
    await resolveDiscordIds([spender]);
    resolvedDiscord = spender.discordId;
  }

  if (!resolvedDiscord) return;

  const qualify = usd >= TOP_SUPPORTER_MIN_USD;
  const outcome = qualify
    ? await addGuildMemberRole(resolvedDiscord)
    : await removeGuildMemberRole(resolvedDiscord);

  if (qualify && (outcome === "granted" || outcome === "already")) {
    await rememberGrant(resolvedDiscord, fivemId, usd);
  }
  if (!qualify && (outcome === "revoked" || outcome === "missing")) {
    await forgetGrant(resolvedDiscord);
  }
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function identitiesFromTebexWebhook(payload: Record<string, unknown>) {
  const subject = asRecord(payload.subject ?? payload.data ?? payload);
  const customer = asRecord(subject.customer);
  const username = asRecord(customer.username);
  const products = Array.isArray(subject.products) ? subject.products : [];
  let fivemId =
    parseFiveMId(username.id) ??
    parseFiveMId(subject.username_id) ??
    parseFiveMId(typeof customer.username === "string" ? customer.username : null) ??
    parseFiveMId(typeof subject.username === "string" ? subject.username : null);

  if (fivemId == null) {
    for (const product of products) {
      const productUser = asRecord(asRecord(product).username);
      fivemId = parseFiveMId(productUser.id) ?? parseFiveMId(asRecord(product).username_id);
      if (fivemId != null) break;
    }
  }

  return { fivemId, discordId: extractDiscordId(payload) };
}
