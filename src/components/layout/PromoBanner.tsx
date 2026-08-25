import { getPromoBannerText, getPromoCode } from "@/lib/site";

export function PromoBanner() {
  const text = getPromoBannerText();
  const code = getPromoCode();
  if (!text && !code) return null;

  return (
    <div className="promo-banner relative z-50 bg-surface-2/80">
      <div className="mx-auto flex max-w-[1600px] items-center justify-center gap-2 px-4 py-1.5 text-center sm:px-6">
        <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {text}
          {code ? (
            <span className="ml-2 rounded-sm border border-cop/30 bg-cop/10 px-1.5 py-0.5 tracking-widest text-cop">
              {code}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
