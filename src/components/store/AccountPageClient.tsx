"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import { getDiscordInvite } from "@/lib/site";
import { refreshBasket, syncBasketAfterAuth, useCartStore } from "@/stores/useCartStore";

export function AccountPageClient() {
  const username = useCartStore((s) => s.username);
  const usernameId = useCartStore((s) => s.usernameId);
  const basketIdent = useCartStore((s) => s.basketIdent);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const clearCart = useCartStore((s) => s.clearCart);
  const discord = getDiscordInvite();

  useEffect(() => {
    if (!hasHydrated || !basketIdent) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      syncBasketAfterAuth().catch(() => undefined);
      return;
    }

    refreshBasket().catch(() => undefined);
  }, [hasHydrated, basketIdent]);

  const displayName = username ?? (usernameId ? `User #${usernameId}` : null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-xl">
        <CardBody className="space-y-4">
          <CardTitle>Your account</CardTitle>
          {displayName ? (
            <p className="text-sm">
              Linked CFX account:{" "}
              <span className="font-semibold text-primary">{displayName}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No account linked yet. Sign in before checkout.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {!displayName ? (
              <Link href="/login">
                <Button variant="pill">Login with FiveM</Button>
              </Link>
            ) : null}
            <Link href="/cart">
              <Button variant="secondary">Open cart</Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <Card className="rounded-xl">
        <CardBody className="space-y-4">
          <CardTitle>Support</CardTitle>
          <p className="text-sm text-muted-foreground">
            Need help with a purchase? Reach out on Discord or visit the support page.
          </p>
          <div className="flex flex-wrap gap-2">
            {discord ? (
              <Link href={discord} target="_blank" rel="noopener noreferrer">
                <Button variant="primary">Discord support</Button>
              </Link>
            ) : null}
            <Link href="/support">
              <Button variant="outline">Support page</Button>
            </Link>
          </div>
          <Button
            variant="ghost"
            className="text-danger"
            onClick={() => {
              clearCart();
              window.location.reload();
            }}
          >
            Sign out (clear local session)
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
