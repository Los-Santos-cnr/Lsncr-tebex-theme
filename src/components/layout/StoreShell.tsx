import { getCategories, isTebexConfigured } from "@/lib/tebex";
import { StoreNavbar } from "@/components/layout/StoreNavbar";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { PromoBanner } from "@/components/layout/PromoBanner";
import { RecentPurchaseToast } from "@/components/store/RecentPurchaseToast";

export async function StoreShell({
  children,
  overlayNav = false,
}: {
  children: React.ReactNode;
  overlayNav?: boolean;
}) {
  const categories = isTebexConfigured() ? await getCategories(false).catch(() => []) : [];

  return (
    <>
      <div className={overlayNav ? "fixed inset-x-0 top-0 z-50" : undefined}>
        <PromoBanner />
        <StoreNavbar categories={categories} overlay={overlayNav} />
      </div>
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <RecentPurchaseToast />
    </>
  );
}
