"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { packageHref } from "@/lib/tebex";
import type { TebexPackage } from "@/lib/tebex-types";
import { addToCart } from "@/stores/useCartStore";

export function PackageDetailClient({
  pkg,
  related,
}: {
  pkg: TebexPackage;
  related: TebexPackage[];
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const onSale = (pkg.discount ?? 0) > 0 || pkg.sale?.active;

  async function handleAdd(goToCart = false) {
    setLoading(true);
    try {
      await addToCart(pkg.id, quantity);
      if (goToCart) router.push("/cart");
    } catch {
      alert("Could not add to cart.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="lscnr-panel relative aspect-square overflow-hidden rounded-sm bg-surface-2 p-6">
          {pkg.image ? (
            <Image
              src={pkg.image}
              alt={pkg.name}
              fill
              className="object-contain"
              sizes="600px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No preview
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {onSale ? (
              <Badge tone="warning" className="font-display tracking-wider">
                Sale
              </Badge>
            ) : null}
            <Badge tone="neutral" className="font-display tracking-wider">
              {pkg.category.name}
            </Badge>
          </div>
          <h1 className="lscnr-heading text-3xl text-foreground">{pkg.name}</h1>
          <p className="lscnr-price text-3xl">{formatPrice(pkg.total_price, pkg.currency)}</p>
          {!pkg.disable_quantity ? (
            <div className="flex items-center gap-2">
              <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">
                Qty
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </Button>
              <span className="w-8 text-center font-display text-sm font-bold">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </Button>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              variant="gta"
              size="md"
              loading={loading}
              onClick={() => handleAdd(false)}
            >
              Add to cart
            </Button>
            <Button variant="outline" size="md" loading={loading} onClick={() => handleAdd(true)}>
              Buy now
            </Button>
          </div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: pkg.description }}
          />
        </div>
      </div>

      {related.length ? (
        <section className="space-y-4">
          <h2 className="lscnr-section-title">More like this</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={packageHref(item)}
                className="lscnr-panel rounded-sm p-3 transition-colors hover:border-cop/35"
              >
                <p className="font-display text-sm font-bold uppercase tracking-wide">{item.name}</p>
                <p className="lscnr-price mt-1 text-sm">
                  {formatPrice(item.total_price, item.currency)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
