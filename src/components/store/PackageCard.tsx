"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Headphones, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardBody } from "@/components/ui/Card";
import { cn } from "@/components/ui/cn";
import { excerpt, formatPrice } from "@/lib/format";
import { PACKAGE_TRUST } from "@/lib/site";
import { packageHref } from "@/lib/tebex";
import type { TebexPackage } from "@/lib/tebex-types";
import { addToCart } from "@/stores/useCartStore";

type Variant = "spotlight" | "grid" | "carousel";

const TRUST_ICONS = {
  delivery: Zap,
  secure: ShieldCheck,
  support: Headphones,
} as const;

export function PackageCard({
  pkg,
  variant = "grid",
  className,
}: {
  pkg: TebexPackage;
  variant?: Variant;
  className?: string;
}) {
  const [adding, setAdding] = useState(false);
  const onSale = (pkg.discount ?? 0) > 0 || pkg.sale?.active;
  const spotlight = variant === "spotlight" || variant === "carousel";

  async function handleAdd() {
    setAdding(true);
    try {
      await addToCart(pkg.id, 1);
    } catch (error) {
      console.error(error);
      alert("Could not add to cart. Link your FiveM account first if prompted.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <article className={cn("lscnr-card flex h-full flex-col overflow-hidden rounded-md", className)}>
      <Link href={packageHref(pkg)} className="relative block">
        <div
          className={cn(
            "relative overflow-hidden bg-surface-2 p-4",
            spotlight ? "aspect-video" : "aspect-[4/3]"
          )}
        >
          {pkg.image ? (
            <Image
              src={pkg.image}
              alt={pkg.name}
              fill
              className="object-contain"
              sizes={spotlight ? "420px" : "300px"}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No preview
            </div>
          )}
          {onSale ? (
            <div className="absolute left-3 top-3 flex gap-2">
              <Badge tone="warning" size="xs" className="font-display tracking-widest">
                Sale
              </Badge>
            </div>
          ) : null}
        </div>
      </Link>

      <CardBody className="flex flex-1 flex-col gap-3 p-4">
        <Link href={packageHref(pkg)} className="hover:text-gold">
          <h3 className="font-display text-lg font-extrabold uppercase leading-tight tracking-wide">
            {pkg.name}
          </h3>
        </Link>

        {spotlight ? (
          <ul className="space-y-2 border-y border-border py-3">
            {PACKAGE_TRUST.map((t) => {
              const Icon = TRUST_ICONS[t.icon];
              return (
                <li key={t.title} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cop/30 bg-gold/10">
                    <Icon className="h-3.5 w-3.5 text-gold" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-foreground">{t.title}</span>
                    <span className="block text-[11px] text-subtle-foreground">{t.subtitle}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="line-clamp-2 text-xs text-muted-foreground">{excerpt(pkg.description, 90)}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div>
            <span className="block text-[10px] font-display uppercase tracking-widest text-subtle-foreground">
              Price
            </span>
            <span className="lscnr-price text-xl">{formatPrice(pkg.total_price, pkg.currency)}</span>
          </div>
          <BadgeCheck className="h-4 w-4 text-gold/70" />
        </div>

        <div className="flex gap-2">
          <Link href={packageHref(pkg)} className="flex-1">
            <Button variant="outline" size="sm" className="w-full font-display uppercase tracking-wide">
              Details
            </Button>
          </Link>
          <Button
            variant="gta"
            size="sm"
            className="flex-1"
            loading={adding}
            onClick={handleAdd}
          >
            Add to cart
          </Button>
        </div>
      </CardBody>
    </article>
  );
}
