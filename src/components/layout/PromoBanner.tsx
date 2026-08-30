import { getCatalogSaleBanner } from "@/lib/tebex";
import { getPromoCode } from "@/lib/site";
import { formatSaleBanner, listActiveSales } from "@/lib/tebex-admin";

export async function PromoBanner() {
  const override = process.env.NEXT_PUBLIC_PROMO_BANNER?.trim() || "";
  const code = getPromoCode();

  let text = override;
  if (!text) {
    try {
      const sales = await listActiveSales();
      text = sales.map(formatSaleBanner).filter(Boolean).join("  ·  ");
    } catch {
      text = "";
    }
  }
  if (!text) {
    try {
      text = await getCatalogSaleBanner();
    } catch {
      text = "";
    }
  }

  if (!text && !code) return null;

  return (
    <div className="promo-banner relative z-50">
      <p className="truncate px-4 py-1.5 text-center font-display text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
        {text}
        {code ? <span className="ml-3 text-foreground">{code}</span> : null}
      </p>
    </div>
  );
}
