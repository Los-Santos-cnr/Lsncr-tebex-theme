"use client";

import { Price } from "@/components/store/Price";
import { cn } from "@/components/ui/cn";
import {
  BULK_DEALS,
  bulkFullTotal,
  bulkLineTotal,
  bulkPercentForQuantity,
} from "@/lib/bulk-deals";

export function BulkDealPicker({
  quantity,
  unitPrice,
  originalUnit,
  currency,
  onSelect,
}: {
  quantity: number;
  unitPrice: number;
  originalUnit?: number | null;
  currency: string;
  onSelect: (quantity: number) => void;
}) {
  const activePercent = bulkPercentForQuantity(quantity);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Stock up
      </p>
      <div className="grid grid-cols-3 gap-2">
        {BULK_DEALS.map((deal) => {
          const selected = quantity === deal.quantity;
          const full = bulkFullTotal(unitPrice, deal.quantity);
          const dealTotal = bulkLineTotal(unitPrice, deal.quantity, deal.percentOff);
          const compare =
            deal.percentOff > 0
              ? bulkFullTotal(originalUnit && originalUnit > unitPrice ? originalUnit : unitPrice, deal.quantity)
              : null;

          return (
            <button
              key={deal.quantity}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(deal.quantity)}
              className={cn(
                "lscnr-panel relative rounded-lg px-2.5 py-3 text-left transition-colors",
                selected
                  ? "border-gold bg-gold/10"
                  : "hover:border-gold/50"
              )}
            >
              {deal.badge ? (
                <span className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.16em] text-gold">
                  {deal.badge}
                </span>
              ) : (
                <span className="mb-1.5 block font-display text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                  Single
                </span>
              )}
              <p className="text-sm font-semibold">Buy {deal.quantity}</p>
              {deal.percentOff > 0 ? (
                <p className="mt-0.5 text-[11px] text-gold">−{deal.percentOff}%</p>
              ) : (
                <p className="mt-0.5 text-[11px] text-muted-foreground">Each</p>
              )}
              <p className="lscnr-price mt-2 block text-sm">
                <Price
                  amount={dealTotal}
                  original={compare && compare > dealTotal ? compare : null}
                  from={currency}
                />
              </p>
              {deal.percentOff > 0 && selected && activePercent === deal.percentOff ? (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Save{" "}
                  <Price amount={full - dealTotal} from={currency} />
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Tokens and packs only. Subscriptions, gift cards, and unique unlocks stay regular price.
      </p>
    </div>
  );
}
