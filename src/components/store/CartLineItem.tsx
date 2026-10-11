"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/store/Price";
import { bulkFullTotal, bulkLineTotal, bulkPercentForQuantity, packageOffersBulkDeals } from "@/lib/bulk-deals";
import { packageHref } from "@/lib/tebex";
import {
  cartItemQuantityLocked,
  removeFromCart,
  setCartQuantity,
  type LocalCartItem,
  useCartStore,
} from "@/stores/useCartStore";

function QuantityStepper({
  item,
  disabled,
}: {
  item: LocalCartItem;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState(String(item.quantity));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(item.quantity));
  }, [item.quantity, focused]);

  function apply(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return false;
    setCartQuantity(item.packageId, parsed);
    return true;
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={disabled || item.quantity <= 1}
        onClick={() => setCartQuantity(item.packageId, item.quantity - 1)}
        aria-label={`Decrease quantity of ${item.name}`}
      >
        −
      </Button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={focused ? draft : String(item.quantity)}
        disabled={disabled}
        onFocus={() => {
          setFocused(true);
          setDraft(String(item.quantity));
        }}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d]/g, "");
          setDraft(next);
          apply(next);
        }}
        onBlur={() => {
          setFocused(false);
          if (!apply(draft)) setDraft(String(item.quantity));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        aria-label={`Quantity for ${item.name}`}
        className="h-8 w-11 rounded-sm border border-border bg-elevated text-center text-sm font-semibold tabular-nums focus-ring disabled:opacity-50"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={disabled || item.quantity >= 99}
        onClick={() => setCartQuantity(item.packageId, item.quantity + 1)}
        aria-label={`Increase quantity of ${item.name}`}
      >
        +
      </Button>
    </div>
  );
}

export function CartLineItem({ item }: { item: LocalCartItem }) {
  const isLoading = useCartStore((s) => s.isLoading);
  const locked = cartItemQuantityLocked(item);
  const bulkPercent = packageOffersBulkDeals(item) ? bulkPercentForQuantity(item.quantity) : 0;
  const lineTotal = bulkLineTotal(item.price, item.quantity, bulkPercent);
  const compareUnit =
    item.originalPrice != null && item.originalPrice > item.price ? item.originalPrice : item.price;
  const lineOriginal =
    bulkFullTotal(compareUnit, item.quantity) > lineTotal
      ? bulkFullTotal(compareUnit, item.quantity)
      : null;

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href={packageHref({ id: item.packageId })}
            className="text-sm font-semibold hover:text-primary"
          >
            {item.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            <Price amount={item.price} original={item.originalPrice} from={item.currency} />
            {item.quantity > 1 ? " each" : null}
            {bulkPercent > 0 ? ` · −${bulkPercent}% bulk` : null}
          </p>
          {packageOffersBulkDeals(item) && !locked && item.quantity < 6 ? (
            <button
              type="button"
              className="mt-1 text-left text-[11px] text-gold hover:underline"
              onClick={() =>
                setCartQuantity(item.packageId, item.quantity < 3 ? 3 : 6)
              }
            >
              {item.quantity < 3 ? "Buy 3, get 10% off" : "Buy 6, get 25% off"}
            </button>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {locked ? (
            <span className="text-xs text-muted-foreground">Qty: 1</span>
          ) : (
            <QuantityStepper item={item} disabled={isLoading} />
          )}
          <p className="lscnr-price min-w-[5.5rem] text-right text-sm">
            <Price amount={lineTotal} original={lineOriginal} from={item.currency} />
          </p>
          <Button
            variant="ghost"
            size="icon"
            disabled={isLoading}
            onClick={() => removeFromCart(item.packageId)}
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
