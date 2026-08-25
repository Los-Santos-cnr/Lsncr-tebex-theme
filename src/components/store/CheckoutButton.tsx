"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { launchTebexCheckout } from "@/components/providers/TebexScript";
import { formatPrice } from "@/lib/format";
import type { TebexBasket } from "@/lib/tebex-types";
import { refreshBasket, useCartStore } from "@/stores/useCartStore";

export function CheckoutButton({ basket }: { basket: TebexBasket }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    try {
      const fresh = await refreshBasket();
      const ident = fresh?.ident ?? basket.ident;
      launchTebexCheckout(ident);
    } catch (error) {
      console.error(error);
      alert("Checkout could not be started. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      loading={loading}
      onClick={handleCheckout}
      disabled={!basket.packages?.length}
    >
      Checkout — {formatPrice(basket.total_price, basket.currency)}
    </Button>
  );
}

export function AuthGate({ basketIdent }: { basketIdent: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const username = useCartStore((s) => s.username);
  const usernameId = useCartStore((s) => s.usernameId);

  if (username || usernameId) return null;

  async function handleAuth(providerName: string) {
    setLoading(providerName);
    try {
      const returnUrl = `${window.location.origin}/cart?success=true`;
      const res = await fetch(
        `/api/basket/${basketIdent}/auth?returnUrl=${encodeURIComponent(returnUrl)}&provider=${providerName}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Auth failed");

      const data = (await res.json()) as {
        provider?: { name: string; url: string };
        providers?: { name: string; url: string }[];
      };

      const url =
        data.provider?.url ??
        data.providers?.find((p) =>
          p.name.toLowerCase().includes(providerName.toLowerCase())
        )?.url;

      if (!url) throw new Error("No auth provider found");
      window.location.href = url;
    } catch (error) {
      console.error(error);
      alert("Could not start authentication. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Sign in to complete purchase</p>
      <p className="text-xs text-muted-foreground">
        Link your CFX or Discord account so purchases deliver correctly.
      </p>
      <Button
        variant="pill"
        className="w-full"
        loading={loading === "fivem"}
        onClick={() => handleAuth("fivem")}
      >
        Continue with FiveM
      </Button>
      <Button
        variant="outline"
        className="w-full"
        loading={loading === "discord"}
        onClick={() => handleAuth("discord")}
      >
        Continue with Discord
      </Button>
    </div>
  );
}

export function CouponForm({ basketIdent }: { basketIdent: string }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const setBasket = useCartStore((s) => s.setBasket);

  async function handleApply(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/basket/${basketIdent}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coupon_code: code.trim() }),
      });
      if (!res.ok) throw new Error("Invalid coupon");
      const data = (await res.json()) as { data: TebexBasket };
      setBasket(data.data);
      setCode("");
    } catch {
      alert("Could not apply coupon code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleApply} className="flex gap-2">
      <Input
        placeholder="Coupon code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" variant="secondary" loading={loading}>
        Apply
      </Button>
    </form>
  );
}
