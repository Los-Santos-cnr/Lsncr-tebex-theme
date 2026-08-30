"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrustStrip } from "@/components/store/TrustStrip";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/store/Price";
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

  function handleAdd(goToCart = false) {
    setLoading(true);
    addToCart(pkg, quantity);
    if (goToCart) router.push("/cart");
    window.setTimeout(() => setLoading(false), 250);
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="lscnr-panel relative aspect-square overflow-hidden rounded-lg bg-surface-2">
          {pkg.image ? (
            <Image
              src={pkg.image}
              alt={pkg.name}
              fill
              className="object-contain p-8"
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
            {onSale ? <Badge tone="warning">Sale</Badge> : null}
            <Badge tone="neutral">{pkg.category.name}</Badge>
          </div>
          <h1 className="lscnr-heading text-3xl text-foreground">{pkg.name}</h1>
          <p className="lscnr-price text-3xl">
            <Price amount={pkg.total_price} from={pkg.currency} />
          </p>
          {!pkg.disable_quantity ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Qty</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </Button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
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
          <TrustStrip />
          <div
            className="lscnr-prose max-w-none text-sm"
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
                className="lscnr-panel rounded-lg p-3 transition-colors hover:border-robber/35"
              >
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="lscnr-price mt-1 text-sm">
                  <Price amount={item.total_price} from={item.currency} />
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
