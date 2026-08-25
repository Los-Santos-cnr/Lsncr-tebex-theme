import { getCategories, isTebexConfigured } from "@/lib/tebex";
import { StoreNavbar } from "@/components/layout/StoreNavbar";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { PromoBanner } from "@/components/layout/PromoBanner";

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
      <PromoBanner />
      <div className="lscnr-beacon-bar" aria-hidden />
      <StoreNavbar categories={categories} overlay={overlayNav} />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </>
  );
}
