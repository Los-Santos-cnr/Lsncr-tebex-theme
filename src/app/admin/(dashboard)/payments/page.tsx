import { ApiErrorNotice, ApiNotConfiguredNotice } from "@/components/admin/ApiNotice";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatPrice } from "@/lib/format";
import { isAdminApiConfigured, listPayments, type TebexPayment } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments", robots: { index: false } };

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  const s = status.toLowerCase();
  if (s === "complete") return "success";
  if (s === "refund") return "warning";
  if (s === "chargeback") return "danger";
  return "neutral";
}

export default async function PaymentsPage() {
  const configured = isAdminApiConfigured();
  let payments: TebexPayment[] = [];
  let error: string | null = null;

  if (configured) {
    try {
      payments = await listPayments(50);
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load payments";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        eyebrow="Transactions"
        description="The 50 most recent payments made on your store."
      />
      {!configured ? (
        <ApiNotConfiguredNotice />
      ) : error ? (
        <ApiErrorNotice message={error} />
      ) : (
        <section className="lscnr-panel overflow-hidden rounded-md">
          {payments.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle-foreground">
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Packages</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium">{p.player?.name ?? p.email ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">#{p.id}</p>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {p.packages?.map((pkg) => pkg.name).join(", ") || "—"}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTone(p.status)} size="xs">
                          {p.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="lscnr-price">
                          {formatPrice(Number(p.amount), p.currency?.iso_4217 ?? "USD")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-8 text-sm text-muted-foreground">No payments yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
