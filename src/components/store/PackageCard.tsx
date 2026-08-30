"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Price } from "@/components/store/Price";
import { packageHref } from "@/lib/tebex";
import type { TebexPackage } from "@/lib/tebex-types";
import { addToCart, useCartStore } from "@/stores/useCartStore";

type Variant = "spotlight" | "grid" | "carousel" | "featured";

export function PackageCard({
  pkg,
  className,
}: {
  pkg: TebexPackage;
  variant?: Variant;
  className?: string;
}) {
  const [adding, setAdding] = useState(false);
  const inCart = useCartStore((s) => s.localItems.some((item) => item.packageId === pkg.id));
  const onSale = (pkg.discount ?? 0) > 0 || Boolean(pkg.sale?.active);
  const salePercent = pkg.sale?.discount || pkg.discount || 0;
  const href = packageHref(pkg);

  function handleAdd(event: MouseEvent) {
    event.preventDefault();
    setAdding(true);
    addToCart(pkg);
    window.setTimeout(() => setAdding(false), 250);
  }

  return (
    <article className={cn("cas-card group", className)}>
      <Link href={href} className="block">
        <div className="cas-card-art">
          {pkg.image ? (
            <Image
              src={pkg.image}
              alt={pkg.name}
              fill
              className="cas-card-image object-contain p-7"
              sizes="360px"
            />
          ) : null}
          {onSale ? (
            <div className="absolute left-3 top-3 z-10">
              <Badge tone="warning" size="xs" className="font-display uppercase tracking-[0.14em]">
                {salePercent > 0 && salePercent <= 100 ? `Sale −${salePercent}%` : "Sale"}
              </Badge>
            </div>
          ) : null}
          <div className="cas-card-fade" />
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-3 p-3.5 pr-20">
            <div className="min-w-0">
              <h3 className="lscnr-heading truncate text-sm text-white">{pkg.name}</h3>
              <Price
                className="lscnr-price mt-1 block text-sm"
                amount={pkg.total_price}
                original={pkg.original_price}
                from={pkg.currency}
              />
            </div>
          </div>
        </div>
      </Link>
      <Button
        variant="gta"
        size="xs"
        loading={adding}
        onClick={handleAdd}
        className="absolute bottom-3.5 right-3.5 z-20"
      >
        {inCart ? "Added" : "Add"}
      </Button>
    </article>
  );
}
