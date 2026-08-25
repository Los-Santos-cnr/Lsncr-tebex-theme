import { ApiErrorNotice, ApiNotConfiguredNotice } from "@/components/admin/ApiNotice";
import { CouponsClient } from "@/components/admin/CouponsClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { isAdminApiConfigured, listCoupons, type TebexCoupon } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons", robots: { index: false } };

export default async function CouponsPage() {
  const configured = isAdminApiConfigured();
  let coupons: TebexCoupon[] = [];
  let error: string | null = null;

  if (configured) {
    try {
      const res = await listCoupons(1);
      coupons = res.data ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load coupons";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        eyebrow="Discounts"
        description="Create and remove discount codes customers can apply at checkout."
      />
      {!configured ? (
        <ApiNotConfiguredNotice />
      ) : error ? (
        <ApiErrorNotice message={error} />
      ) : (
        <CouponsClient initialCoupons={coupons} />
      )}
    </div>
  );
}
