import { ExternalLink } from "lucide-react";
import { ApiNotConfiguredNotice } from "@/components/admin/ApiNotice";
import { PackagesClient, type AdminPackageRow } from "@/components/admin/PackagesClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getAllPackages, isTebexConfigured } from "@/lib/tebex";
import { isAdminApiConfigured } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop items", robots: { index: false } };

export default async function PackagesPage() {
  const apiConfigured = isAdminApiConfigured();
  let rows: AdminPackageRow[] = [];

  if (isTebexConfigured()) {
    const packages = await getAllPackages().catch(() => []);
    rows = packages.map((p) => ({
      id: p.id,
      name: p.name,
      base_price: p.base_price,
      currency: p.currency,
      categoryName: p.category.name,
      image: p.image,
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shop items"
        eyebrow="Packages"
        description="Edit the name and price of existing packages, or disable them from sale."
        actions={
          <a href="https://creator.tebex.io" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              New item in Tebex
            </Button>
          </a>
        }
      />
      <p className="rounded-md border border-border bg-surface/50 px-4 py-3 text-xs text-muted-foreground">
        Tebex&apos;s API does not support creating brand-new packages — add new products in the Tebex
        Creator panel, then edit their name, price, and availability here.
      </p>
      {!apiConfigured ? <ApiNotConfiguredNotice /> : <PackagesClient packages={rows} />}
    </div>
  );
}
