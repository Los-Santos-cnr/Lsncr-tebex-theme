"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AuthGate, CheckoutButton, CouponForm } from "@/components/store/CheckoutButton";
import { CartLineItem } from "@/components/store/CartLineItem";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { ensureBasket, refreshBasket, syncBasketAfterAuth, useCartStore } from "@/stores/useCartStore";

export function CartPageClient() {
  const basket = useCartStore((s) => s.basket);
  const basketIdent = useCartStore((s) => s.basketIdent);
  const isLoading = useCartStore((s) => s.isLoading);
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" && basketIdent) {
      syncBasketAfterAuth().catch(() => undefined);
      return;
    }

    if (basketIdent) {
      refreshBasket().catch(() => ensureBasket().catch(() => undefined));
      return;
    }

    ensureBasket().catch(() => undefined);
  }, [hasHydrated, basketIdent]);

  if (!basket || !basketIdent) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse the store and add packages to get started."
        action={
          <Link href="/">
            <Button variant="primary">Browse packages</Button>
          </Link>
        }
      />
    );
  }

  const items = basket.packages ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2 rounded-xl">
        <CardBody>
          <CardTitle className="mb-2">Cart items</CardTitle>
          {items.length ? (
            items.map((item, index) => (
              <CartLineItem key={`${item.package?.id ?? index}`} item={item} />
            ))
          ) : (
            <EmptyState title="No items yet" description="Add packages from the store." />
          )}
        </CardBody>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="rounded-xl">
          <CardBody className="space-y-4">
            <CardTitle>Order summary</CardTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(basket.base_price, basket.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(basket.sales_tax, basket.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span className="text-primary">
                  {formatPrice(basket.total_price, basket.currency)}
                </span>
              </div>
            </div>
            <CouponForm basketIdent={basketIdent} />
            <AuthGate basketIdent={basketIdent} />
            <CheckoutButton basket={basket} />
            {isLoading ? (
              <p className="text-center text-xs text-muted-foreground">Updating cart…</p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
