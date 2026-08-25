"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { packageHref } from "@/lib/tebex";
import type { TebexBasketPackage } from "@/lib/tebex-types";
import { removeFromCart, useCartStore } from "@/stores/useCartStore";

export function CartLineItem({ item }: { item: TebexBasketPackage }) {
  const pkg = item.package;
  const isLoading = useCartStore((s) => s.isLoading);

  if (!pkg) return null;

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {pkg.image ? (
          <Image src={pkg.image} alt={pkg.name} fill className="object-cover" sizes="64px" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={packageHref(pkg)} className="text-sm font-semibold hover:text-primary">
            {pkg.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatPrice(pkg.total_price, pkg.currency)} each
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Qty: {item.qty}</span>
          <Button
            variant="ghost"
            size="icon"
            disabled={isLoading}
            onClick={() => removeFromCart(pkg.id)}
            aria-label="Remove item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
