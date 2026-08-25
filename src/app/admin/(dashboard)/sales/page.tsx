import { ExternalLink } from "lucide-react";
import { ApiErrorNotice, ApiNotConfiguredNotice } from "@/components/admin/ApiNotice";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { isAdminApiConfigured, listSales, type TebexSale } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sales", robots: { index: false } };

export default async function SalesPage() {
  const configured = isAdminApiConfigured();
  let sales: TebexSale[] = [];
  let error: string | null = null;

  if (configured) {
    try {
      const res = await listSales();
      sales = res.data ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load sales";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        eyebrow="Promotions"
        description="Active store-wide sales. Sales are created and edited in the Tebex Creator panel."
      />
      {!configured ? (
        <ApiNotConfiguredNotice />
      ) : error ? (
        <ApiErrorNotice message={error} />
      ) : (
        <>
          <p className="flex items-center gap-1.5 rounded-md border border-border bg-surface/50 px-4 py-3 text-xs text-muted-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
            The Tebex API is read-only for sales. Create new sales in the{" "}
            <a
              href="https://creator.tebex.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              Tebex Creator panel
            </a>
            .
          </p>
          <section className="lscnr-panel rounded-md">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                Active sales ({sales.length})
              </h2>
            </div>
            {sales.length ? (
              <ul className="divide-y divide-border">
                {sales.map((sale) => (
                  <li key={sale.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{sale.name}</span>
                        <Badge tone="warning" size="xs">
                          {sale.discount.type === "percentage"
                            ? `${sale.discount.percentage}%`
                            : `${sale.discount.value} off`}
                        </Badge>
                        <Badge tone="neutral" size="xs">
                          {sale.effective.type}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Ends {new Date(sale.expire * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-sm text-muted-foreground">No active sales.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
