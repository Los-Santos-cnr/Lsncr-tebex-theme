import { NextResponse } from "next/server";
import { desc, eq, or } from "drizzle-orm";
import { orders } from "../../../../../drizzle/schema";
import { db, ensureOrdersTable, isDatabaseConfigured } from "@/lib/db";
import {
  getPayment,
  getPlayerPackages,
  isAdminApiConfigured,
  listPayments,
  lookupPlayer,
  type TebexPayment,
} from "@/lib/tebex-admin";
import { getAllPackages, getSidebarRecentPayments, packageHref } from "@/lib/tebex";
import {
  isSubscriptionPackageName,
  mergeTransactions,
  paymentStatusLabel,
  sameAccount,
  type AccountSubscription,
  type AccountTransaction,
} from "@/lib/account";

export const dynamic = "force-dynamic";

function isoFromUnix(seconds: number) {
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function fromPluginPayment(payment: TebexPayment): AccountTransaction {
  const names = (payment.packages ?? []).map((pkg) => pkg.name?.trim()).filter(Boolean);
  return {
    id: `tbx-${payment.id}`,
    item: names.join(", ") || "Purchase",
    amount: Number(payment.amount),
    currency: payment.currency?.iso_4217 ?? "EUR",
    at: payment.date,
    status: paymentStatusLabel(payment.status),
    href: payment.packages?.[0]?.id ? `/packages/${payment.packages[0].id}` : null,
  };
}

async function fromDatabase(username: string | null, usernameId: string | null) {
  if (!isDatabaseConfigured()) return [] as AccountTransaction[];
  await ensureOrdersTable();
  const rows = await db
    .select()
    .from(orders)
    .where(
      usernameId && username
        ? or(eq(orders.usernameId, usernameId), eq(orders.username, username))
        : usernameId
          ? eq(orders.usernameId, usernameId)
          : eq(orders.username, username!)
    )
    .orderBy(desc(orders.createdAt));

  return rows.map((row) => {
    const names = (row.packages ?? []).map((pkg) => pkg.name).filter(Boolean);
    return {
      id: row.tebexTransactionId || `db-${row.id}`,
      item: names.join(", ") || "Purchase",
      amount: Number(row.total),
      currency: row.currency || "EUR",
      at: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      status: paymentStatusLabel(row.status),
      href: row.packages?.[0]?.id ? `/packages/${row.packages[0].id}` : null,
    } satisfies AccountTransaction;
  });
}

async function fromPlugin(username: string | null, usernameId: string | null) {
  if (!isAdminApiConfigured()) {
    return { transactions: [] as AccountTransaction[], subscriptions: [] as AccountSubscription[] };
  }

  const lookupKey = username || usernameId;
  let lookup = lookupKey ? await lookupPlayer(lookupKey).catch(() => null) : null;
  if (!lookup && usernameId && usernameId !== lookupKey) {
    lookup = await lookupPlayer(usernameId).catch(() => null);
  }

  const transactions: AccountTransaction[] = [];
  const payments = lookup?.payments ?? [];

  const details = await Promise.all(
    payments.slice(0, 30).map(async (payment) => {
      try {
        return fromPluginPayment(await getPayment(payment.txn_id));
      } catch {
        return {
          id: payment.txn_id,
          item: "Purchase",
          amount: Number(payment.price),
          currency: payment.currency || "EUR",
          at: isoFromUnix(payment.time),
          status: paymentStatusLabel(payment.status),
          href: null,
        } satisfies AccountTransaction;
      }
    })
  );
  transactions.push(...details);

  if (!transactions.length) {
    const recent = await listPayments(100).catch(() => []);
    transactions.push(
      ...recent
        .filter(
          (payment) =>
            sameAccount(payment.player?.name, username) ||
            sameAccount(payment.player?.id, usernameId) ||
            sameAccount(payment.player?.uuid, usernameId)
        )
        .map(fromPluginPayment)
    );
  }

  const playerId =
    lookup?.player?.id ||
    (lookup?.player?.plugin_username_id != null
      ? String(lookup.player.plugin_username_id)
      : usernameId);

  const packages = playerId ? await getPlayerPackages(playerId).catch(() => []) : [];
  const catalog = await getAllPackages().catch(() => []);
  const subscriptions = packages
    .filter((row) => isSubscriptionPackageName(row.package?.name ?? ""))
    .map((row) => {
      const pkg = catalog.find((item) => item.id === row.package?.id);
      return {
        id: row.txn_id,
        name: row.package?.name ?? "Membership",
        status: "Active",
        since: row.date ?? null,
        href: pkg ? packageHref(pkg) : row.package?.id ? `/packages/${row.package.id}` : null,
      } satisfies AccountSubscription;
    });

  return { transactions, subscriptions };
}

async function fromHeadless(username: string | null, usernameId: string | null) {
  const payments = await getSidebarRecentPayments().catch(() => []);
  const catalog = await getAllPackages().catch(() => []);
  return payments
    .filter(
      (payment) =>
        sameAccount(payment.username, username) || sameAccount(payment.username_id, usernameId)
    )
    .map((payment) => {
      const pkg = catalog.find(
        (item) =>
          item.name.trim().toLowerCase() === (payment.package?.name ?? "").trim().toLowerCase()
      );
      return {
        id: `sb-${payment.username_id ?? "anon"}-${payment.created_at}`,
        item: payment.package?.name?.trim() || "Purchase",
        amount: null,
        currency: pkg?.currency ?? "EUR",
        at: payment.created_at ?? new Date().toISOString(),
        status: "Complete",
        href: pkg ? packageHref(pkg) : payment.package?.id ? `/packages/${payment.package.id}` : null,
      } satisfies AccountTransaction;
    });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim() || null;
  const usernameId = searchParams.get("usernameId")?.trim() || null;

  if (!username && !usernameId) {
    return NextResponse.json({ error: "username or usernameId required" }, { status: 400 });
  }

  try {
    const [dbRows, plugin, headless] = await Promise.all([
      fromDatabase(username, usernameId).catch(() => [] as AccountTransaction[]),
      fromPlugin(username, usernameId).catch(() => ({
        transactions: [] as AccountTransaction[],
        subscriptions: [] as AccountSubscription[],
      })),
      fromHeadless(username, usernameId).catch(() => [] as AccountTransaction[]),
    ]);

    return NextResponse.json({
      subscriptions: plugin.subscriptions,
      transactions: mergeTransactions([...dbRows, ...plugin.transactions, ...headless]),
    });
  } catch (error) {
    console.error("account purchases:", error);
    return NextResponse.json({ subscriptions: [], transactions: [] });
  }
}
