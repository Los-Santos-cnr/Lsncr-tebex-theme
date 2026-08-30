import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { orders } from "../../../../drizzle/schema";
import { db, ensureOrdersTable, isDatabaseConfigured } from "@/lib/db";
import { isSubscriptionPackageName } from "@/lib/account";
import { isAdminApiConfigured, listPayments } from "@/lib/tebex-admin";
import { getAllPackages, getSidebarRecentPayments, packageHref } from "@/lib/tebex";
import type { TebexPackage } from "@/lib/tebex-types";
import { lookupPlayerNames, fivemIdFromTebexPlayer, parseFiveMId } from "@/lib/player-lookup";
import { getSupporterRanks } from "@/lib/supporters";
import {
  ANON_BUYER,
  normalizePackageName,
  type PurchaseAction,
  type RecentPurchase,
} from "@/lib/recent-purchases";

export const dynamic = "force-dynamic";

type PackageRef = { id?: number; name?: string; quantity?: number; qty?: number };

type PurchaseDraft = RecentPurchase & {
  fivemId?: string | number | null;
  renewal?: boolean;
};

function packageQty(pkg: PackageRef) {
  const qty = Number(pkg.quantity ?? pkg.qty ?? 1);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function summarizePackages(packages: PackageRef[] | null | undefined) {
  const lines = new Map<string, { id: number | null; name: string; quantity: number }>();

  for (const pkg of packages ?? []) {
    const name = pkg.name?.trim();
    if (!name && pkg.id == null) continue;
    const key = pkg.id != null ? `id:${pkg.id}` : `name:${normalizePackageName(name || "")}`;
    const current = lines.get(key);
    if (current) {
      current.quantity += packageQty(pkg);
      continue;
    }
    lines.set(key, {
      id: pkg.id ?? null,
      name: name || "a package",
      quantity: packageQty(pkg),
    });
  }

  return [...lines.values()].sort((a, b) => b.quantity - a.quantity);
}

function fromPackages(
  id: string,
  fivemId: string | number | null | undefined,
  packages: PackageRef[] | null | undefined,
  at: string,
  renewal = false
): PurchaseDraft[] {
  const [first] = summarizePackages(packages);
  if (!first) return [];
  return [
    {
      id,
      buyer: ANON_BUYER,
      fivemId: parseFiveMId(fivemId),
      item: first.name,
      at,
      packageId: first.id,
      quantity: first.quantity,
      renewal,
    },
  ];
}

function hrefForPurchase(purchase: RecentPurchase, catalog: TebexPackage[]) {
  if (purchase.packageId) {
    const byId = catalog.find((pkg) => pkg.id === purchase.packageId);
    if (byId) return packageHref(byId);
  }

  const needle = normalizePackageName(purchase.item);
  const exact = catalog.find((pkg) => normalizePackageName(pkg.name) === needle);
  if (exact) return packageHref(exact);

  const loose = catalog.filter((pkg) => {
    const name = normalizePackageName(pkg.name);
    return name.includes(needle) || needle.includes(name);
  });
  if (loose.length === 1) return packageHref(loose[0]);
  return null;
}

function catalogPackage(purchase: RecentPurchase, catalog: TebexPackage[]) {
  if (purchase.packageId) {
    const byId = catalog.find((pkg) => pkg.id === purchase.packageId);
    if (byId) return byId;
  }
  const needle = normalizePackageName(purchase.item);
  return catalog.find((pkg) => normalizePackageName(pkg.name) === needle);
}

function purchaseAction(pkg: TebexPackage | undefined, item: string, renewal?: boolean): PurchaseAction {
  const subscribed = pkg?.type === "subscription" || isSubscriptionPackageName(item);
  if (!subscribed) return "purchased";
  return renewal ? "resubscribed" : "subscribed";
}

async function withPackageLinks(items: PurchaseDraft[]): Promise<PurchaseDraft[]> {
  if (!items.length) return items;
  const catalog = await getAllPackages().catch(() => []);
  return items.map((item) => {
    const pkg = catalogPackage(item, catalog);
    return {
      ...item,
      packageId: item.packageId ?? pkg?.id ?? null,
      href: hrefForPurchase(item, catalog),
      action: purchaseAction(pkg, item.item, item.renewal),
    };
  });
}

async function withPlayerNames(items: PurchaseDraft[]): Promise<RecentPurchase[]> {
  const [names, ranks] = await Promise.all([
    lookupPlayerNames(items.map((item) => item.fivemId)),
    getSupporterRanks().catch(() => new Map<number, number>()),
  ]);

  return items.map(({ fivemId, renewal: _renewal, ...item }) => {
    const id = parseFiveMId(fivemId);
    const name = id != null ? names.get(id) : null;
    return {
      ...item,
      buyer: name || ANON_BUYER,
      rank: id != null ? ranks.get(id) ?? null : null,
    };
  });
}

function hadEarlierPackage(
  fivemId: number | null,
  packageIds: number[],
  packageNames: string[],
  at: string,
  history: Array<{ fivemId: number | null; packageIds: number[]; packageNames: string[]; at: string }>
) {
  if (fivemId == null || (!packageIds.length && !packageNames.length)) return false;
  const when = Date.parse(at);
  if (Number.isNaN(when)) return false;
  return history.some((row) => {
    if (row.fivemId !== fivemId) return false;
    if (!(Date.parse(row.at) < when)) return false;
    if (row.packageIds.some((packageId) => packageIds.includes(packageId))) return true;
    return row.packageNames.some((name) => packageNames.includes(name));
  });
}

function historyRow(
  fivemId: number | null,
  packages: PackageRef[] | null | undefined,
  at: string
) {
  return {
    fivemId,
    packageIds: (packages ?? [])
      .map((pkg) => pkg.id)
      .filter((id): id is number => typeof id === "number" && Number.isFinite(id) && id > 0),
    packageNames: (packages ?? [])
      .map((pkg) => normalizePackageName(pkg.name ?? ""))
      .filter(Boolean),
    at,
  };
}

async function fromDatabase(): Promise<PurchaseDraft[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureOrdersTable();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(16);
  const history = rows.map((row) =>
    historyRow(
      parseFiveMId(row.usernameId),
      row.packages,
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)
    )
  );

  return rows.flatMap((row, index) =>
    fromPackages(
      `db-${row.id}`,
      row.usernameId,
      row.packages,
      history[index].at,
      hadEarlierPackage(
        history[index].fivemId,
        history[index].packageIds,
        history[index].packageNames,
        history[index].at,
        history
      )
    )
  );
}

async function fromPluginApi(): Promise<PurchaseDraft[]> {
  if (!isAdminApiConfigured()) return [];
  const payments = (await listPayments(20, { revalidate: 30 })).filter(
    (payment) => (payment.status ?? "complete").toLowerCase() === "complete"
  );
  const history = payments.map((payment) =>
    historyRow(fivemIdFromTebexPlayer(payment.player), payment.packages, payment.date)
  );

  return payments.flatMap((payment, index) =>
    fromPackages(
      `tbx-${payment.id}`,
      fivemIdFromTebexPlayer(payment.player),
      payment.packages,
      payment.date,
      hadEarlierPackage(
        history[index].fivemId,
        history[index].packageIds,
        history[index].packageNames,
        payment.date,
        history
      )
    )
  );
}

async function fromHeadlessSidebar(): Promise<PurchaseDraft[]> {
  const payments = await getSidebarRecentPayments();
  const history = payments.map((payment) =>
    historyRow(
      parseFiveMId(payment.username_id),
      payment.package ? [payment.package] : [],
      payment.created_at ?? new Date().toISOString()
    )
  );

  return payments.flatMap((payment, index) =>
    fromPackages(
      `sb-${payment.username_id ?? "anon"}-${payment.created_at ?? index}`,
      payment.username_id,
      payment.package ? [payment.package] : [],
      history[index].at,
      hadEarlierPackage(
        history[index].fivemId,
        history[index].packageIds,
        history[index].packageNames,
        history[index].at,
        history
      )
    )
  );
}

export async function GET() {
  const sources = [fromPluginApi, fromDatabase, fromHeadlessSidebar];

  for (const source of sources) {
    try {
      const data = await withPlayerNames(await withPackageLinks(await source()));
      if (data.length) return NextResponse.json({ data: data.slice(0, 12) });
    } catch (error) {
      console.error("recent purchases:", error);
    }
  }

  return NextResponse.json({ data: [] });
}
