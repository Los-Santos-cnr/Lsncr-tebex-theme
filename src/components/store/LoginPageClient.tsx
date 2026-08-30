"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { CardBody, CardTitle } from "@/components/ui/Card";
import { beginBasketAuth, useCartStore } from "@/stores/useCartStore";

export function LoginPageClient() {
  const username = useCartStore((s) => s.username);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const [loading, setLoading] = useState(false);

  async function handleFiveM() {
    setLoading(true);
    try {
      await beginBasketAuth({
        provider: "fivem",
        returnUrl: `${window.location.origin}/account`,
      });
    } catch (error) {
      useCartStore.getState().setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Authentication could not be started.",
      });
      setLoading(false);
    }
  }

  if (!hasHydrated) {
    return <p className="text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (username) {
    return (
      <div className="lscnr-panel mx-auto max-w-md rounded-lg">
        <CardBody className="space-y-3 text-center">
          <CardTitle className="lscnr-heading text-xl">You&apos;re linked</CardTitle>
          <p className="text-sm text-muted-foreground">
            Playing as <span className="font-semibold">{username}</span>
          </p>
          <Button variant="gta" onClick={() => (window.location.href = "/account")}>
            Account
          </Button>
        </CardBody>
      </div>
    );
  }

  return (
    <div className="lscnr-panel mx-auto max-w-md rounded-lg">
      <CardBody className="space-y-4">
        <CardTitle className="lscnr-heading text-xl">Link FiveM</CardTitle>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your CFX account is how purchases deliver in-game. Discord is collected later at
          checkout, and it never replaces this FiveM name.
        </p>
        <Button variant="pill" className="w-full" loading={loading} onClick={handleFiveM}>
          Continue with FiveM
        </Button>
      </CardBody>
    </div>
  );
}
