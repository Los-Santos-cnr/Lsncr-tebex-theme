import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { orders } from "../../../../drizzle/schema";
import { db, ensureOrdersTable, isDatabaseConfigured } from "@/lib/db";
import { isAdminApiConfigured, listPayments } from "@/lib/tebex-admin";
import { getAllPackages, getSidebarRecentPayments, packageHref } from "@/lib/tebex";
import type { TebexPackage } from "@/lib/tebex-types";
import { lookupPlayerNames, parseFiveMId } from "@/lib/player-lookup";
import {
  ANON_BUYER,
  normalizePackageName,
  type RecentPurchase,
} from "@/lib/recent-purchases";

export const revalidate = 30;

type PurchaseDraft = RecentPurchase & { fivemId?: string | number | null };

function fromPackages(
  id: string,
  fivemId: string | number | null | undefined,
  packages: { id?: number; name?: string }[] | null | undefined,
  at: string,
  avatar?: string | null
): PurchaseDraft[] {
  const first = (packages ?? []).find((pkg) => pkg.name?.trim() || pkg.id);
  const item = first?.name?.trim() || "a package";
  return [
    {
      id,
      buyer: ANON_BUYER,
      fivemId: parseFiveMId(fivemId),
      item,
      at,
      avatar: avatar || null,
      packageId: first?.id ?? null,
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

async function withPackageLinks(items: PurchaseDraft[]): Promise<PurchaseDraft[]> {
  if (!items.length) return items;
  const catalog = await getAllPackages().catch(() => []);
  return items.map((item) => ({
    ...item,
    href: hrefForPurchase(item, catalog),
  }));
}

async function withPlayerNames(items: PurchaseDraft[]): Promise<RecentPurchase[]> {
  const names = await lookupPlayerNames(items.map((item) => item.fivemId));
  return items.map(({ fivemId, ...item }) => {
    const id = parseFiveMId(fivemId);
    const name = id != null ? names.get(id) : null;
    return { ...item, buyer: name || ANON_BUYER };
  });
}

async function fromDatabase(): Promise<PurchaseDraft[]> {
  if (!isDatabaseConfigured()) return [];
  await ensureOrdersTable();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(16);
  return rows.flatMap((row) =>
    fromPackages(
      `db-${row.id}`,
      row.usernameId,
      row.packages,
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)
    )
  );
}

async function fromPluginApi(): Promise<PurchaseDraft[]> {
  if (!isAdminApiConfigured()) return [];
  const payments = await listPayments(20);
  return payments
    .filter((payment) => (payment.status ?? "complete").toLowerCase() === "complete")
    .flatMap((payment) =>
      fromPackages(
        `tbx-${payment.id}`,
        payment.player?.id,
        payment.packages,
        payment.date
      )
    );
}

async function fromHeadlessSidebar(): Promise<PurchaseDraft[]> {
  const payments = await getSidebarRecentPayments();
  return payments.flatMap((payment, index) =>
    fromPackages(
      `sb-${payment.username_id ?? "anon"}-${payment.created_at ?? index}`,
      payment.username_id,
      payment.package ? [payment.package] : [],
      payment.created_at ?? new Date().toISOString(),
      payment.avatar_url
    )
  );
}

export async function GET() {
  const sources = [fromDatabase, fromPluginApi, fromHeadlessSidebar];

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
