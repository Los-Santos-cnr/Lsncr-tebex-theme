"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CardBody, CardTitle } from "@/components/ui/Card";
import {
  ensureBasket,
  useCartStore,
} from "@/stores/useCartStore";

export function LoginPageClient() {
  const basketIdent = useCartStore((s) => s.basketIdent);
  const username = useCartStore((s) => s.username);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;
    ensureBasket().catch(() => undefined);
  }, [hasHydrated]);

  async function handleAuth(providerName: string) {
    setLoading(providerName);
    try {
      const ident = basketIdent ?? (await ensureBasket());
      const returnUrl = `${window.location.origin}/account?success=true`;
      const res = await fetch(
        `/api/basket/${ident}/auth?returnUrl=${encodeURIComponent(returnUrl)}&provider=${providerName}`,
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
    } catch {
      alert("Authentication could not be started.");
    } finally {
      setLoading(null);
    }
  }

  if (username) {
    return (
      <div className="lscnr-panel mx-auto max-w-md rounded-sm">
        <CardBody className="space-y-3 text-center">
          <CardTitle className="lscnr-heading text-xl">You&apos;re linked</CardTitle>
          <p className="text-sm text-muted-foreground">
            Playing as <span className="font-display font-bold text-gold">{username}</span>
          </p>
          <Button variant="gta" onClick={() => (window.location.href = "/account")}>
            Account
          </Button>
        </CardBody>
      </div>
    );
  }

  return (
    <div className="lscnr-panel mx-auto max-w-md rounded-sm">
      <CardBody className="space-y-4">
        <CardTitle className="lscnr-heading text-xl">Link before you buy</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your CFX account is how we know which character gets VIP, vehicles, and items after
          checkout. Discord works too if it&apos;s enabled on the server store.
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
      </CardBody>
    </div>
  );
}
