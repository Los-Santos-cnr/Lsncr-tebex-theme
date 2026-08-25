import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CardBody } from "@/components/ui/Card";
import { formatPrice } from "@/lib/format";
import {
  getStoreInformation,
  isAdminApiConfigured,
  listPayments,
  type TebexPayment,
  type TebexStoreInformation,
} from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const configured = isAdminApiConfigured();

  let info: TebexStoreInformation | null = null;
  let payments: TebexPayment[] = [];
  let apiError: string | null = null;

  if (configured) {
    try {
      [info, payments] = await Promise.all([
        getStoreInformation(),
        listPayments(6).catch(() => [] as TebexPayment[]),
      ]);
    } catch (error) {
      apiError = error instanceof Error ? error.message : "Failed to reach Tebex Plugin API";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        eyebrow="Tebex Admin"
        description="Manage coupons, gift cards, shop items, sales, payments, and bans through the Tebex Plugin API."
      />

      {!configured ? (
        <div className="lscnr-panel rounded-md">
          <CardBody className="space-y-2 p-6 text-sm">
            <p className="font-medium text-foreground">Tebex Plugin API is not configured.</p>
            <p className="text-muted-foreground">
              Add your server <code className="text-gold">TEBEX_SECRET_KEY</code> to the environment
              to enable coupon, gift card, and package management. You can find it in the Tebex
              Creator panel under your game server integration.
            </p>
          </CardBody>
        </div>
      ) : apiError ? (
        <div className="lscnr-panel rounded-md">
          <CardBody className="space-y-1 p-6 text-sm">
            <p className="font-medium text-danger">Could not reach the Tebex Plugin API.</p>
            <p className="text-muted-foreground">{apiError}</p>
          </CardBody>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lscnr-panel rounded-md">
            <CardBody className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-subtle-foreground">
                Store
              </p>
              <p className="mt-1 lscnr-heading text-lg">{info?.account?.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground">{info?.account?.domain ?? ""}</p>
            </CardBody>
          </div>
          <div className="lscnr-panel rounded-md">
            <CardBody className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-subtle-foreground">
                Currency
              </p>
              <p className="mt-1 lscnr-heading text-lg">
                {info?.account?.currency?.iso_4217 ?? "—"}{" "}
                <span className="text-muted-foreground">{info?.account?.currency?.symbol}</span>
              </p>
            </CardBody>
          </div>
          <div className="lscnr-panel rounded-md">
            <CardBody className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-subtle-foreground">
                Linked server
              </p>
              <p className="mt-1 lscnr-heading text-lg">{info?.server?.name ?? "—"}</p>
            </CardBody>
          </div>
        </div>
      )}

      {configured && !apiError ? (
        <section className="lscnr-panel rounded-md">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide">
              Recent payments
            </h2>
            <Link href="/admin/payments" className="text-xs text-gold hover:underline">
              View all
            </Link>
          </div>
          {payments.length ? (
            <ul className="divide-y divide-border">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {p.player?.name ?? p.email ?? `Payment #${p.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.date).toLocaleString()} · {p.status}
                    </p>
                  </div>
                  <span className="lscnr-price shrink-0 text-sm">
                    {formatPrice(Number(p.amount), p.currency?.iso_4217 ?? "USD")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted-foreground">No payments yet.</p>
          )}
        </section>
      ) : null}

      <p className="flex items-center gap-1.5 text-xs text-subtle-foreground">
        <ExternalLink className="h-3.5 w-3.5" />
        New shop items must be created in the{" "}
        <a
          href="https://creator.tebex.io"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:underline"
        >
          Tebex Creator panel
        </a>
        . This admin can edit existing items.
      </p>
    </div>
  );
}
