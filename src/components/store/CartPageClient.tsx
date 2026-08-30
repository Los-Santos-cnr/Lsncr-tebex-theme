"use client";

import Link from "next/link";
import { CheckoutButton, CheckoutDetails, CouponForm } from "@/components/store/CheckoutButton";
import { CartLineItem } from "@/components/store/CartLineItem";
import { TrustStrip } from "@/components/store/TrustStrip";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/store/Price";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useCartStore } from "@/stores/useCartStore";

export function CartPageClient() {
  const localItems = useCartStore((s) => s.localItems);
  const isLoading = useCartStore((s) => s.isLoading);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const { currency } = useCurrency();

  if (!hasHydrated) {
    return <p className="text-sm text-muted-foreground">Loading cart…</p>;
  }

  if (!localItems.length) {
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

  const subtotal = localItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const storeCurrency = localItems[0]?.currency ?? "EUR";
  const chargedInStoreCurrency = storeCurrency.toUpperCase() !== currency;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2 rounded-xl">
        <CardBody>
          <CardTitle className="mb-2">Cart items</CardTitle>
          {localItems.map((item) => (
            <CartLineItem key={item.packageId} item={item} />
          ))}
        </CardBody>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Card className="rounded-xl">
          <CardBody className="space-y-4">
            <CardTitle>Order summary</CardTitle>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  <Price amount={subtotal} from={storeCurrency} />
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span>Total</span>
                <span className="text-primary">
                  <Price amount={subtotal} from={storeCurrency} />
                </span>
              </div>
            </div>
            {chargedInStoreCurrency ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Displayed in {currency}. Tebex will charge {storeCurrency.toUpperCase()} at
                checkout. Tax is calculated when you pay.
              </p>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Tax is calculated when you pay.
              </p>
            )}
            <CouponForm />
            <CheckoutDetails />
            <CheckoutButton total={subtotal} currency={storeCurrency} />
            <TrustStrip />
            {isLoading ? (
              <p className="text-center text-xs text-muted-foreground">Preparing checkout…</p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
