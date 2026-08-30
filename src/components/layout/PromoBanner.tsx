import { getPromoBannerText, getPromoCode } from "@/lib/site";

export function PromoBanner() {
  const text = getPromoBannerText();
  const code = getPromoCode();
  if (!text && !code) return null;

  return (
    <div className="promo-banner relative z-50">
      <p className="px-4 py-1.5 text-center font-display text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
        {text}
        {code ? <span className="ml-3 text-foreground">{code}</span> : null}
      </p>
    </div>
  );
}
