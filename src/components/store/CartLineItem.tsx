"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/store/Price";
import { packageHref } from "@/lib/tebex";
import { removeFromCart, type LocalCartItem, useCartStore } from "@/stores/useCartStore";

export function CartLineItem({ item }: { item: LocalCartItem }) {
  const isLoading = useCartStore((s) => s.isLoading);

  return (
    <div className="flex gap-4 border-b border-border py-4 last:border-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href={packageHref({ id: item.packageId })}
            className="text-sm font-semibold hover:text-primary"
          >
            {item.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            <Price amount={item.price} original={item.originalPrice} from={item.currency} /> each
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
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
