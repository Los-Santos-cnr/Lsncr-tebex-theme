"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { refreshBasket, syncBasketAfterAuth, useCartStore } from "@/stores/useCartStore";

function CartBootstrapInner() {
  const searchParams = useSearchParams();
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    const authReturn =
      searchParams.get("success") === "true" ||
      searchParams.get("auth") === "1";

    if (authReturn) {
      syncBasketAfterAuth().catch(() => undefined);
      return;
    }

    refreshBasket().catch(() => undefined);
  }, [hasHydrated, searchParams]);

  return null;
}

export function CartBootstrap() {
  return (
    <Suspense fallback={null}>
      <CartBootstrapInner />
    </Suspense>
  );
}
