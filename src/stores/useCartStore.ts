"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TebexBasket } from "@/lib/tebex-types";
import { basketHasAuth } from "@/lib/tebex";

interface CartState {
  basketIdent: string | null;
  basket: TebexBasket | null;
  username: string | null;
  usernameId: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setBasket: (basket: TebexBasket) => void;
  setBasketIdent: (ident: string | null) => void;
  setUsername: (username: string | null, usernameId?: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  clearCart: () => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      basketIdent: null,
      basket: null,
      username: null,
      usernameId: null,
      isLoading: false,
      hasHydrated: false,
      setBasket: (basket) =>
        set({
          basket,
          basketIdent: basket.ident,
          username: basket.username ?? null,
          usernameId:
            basket.username_id != null ? String(basket.username_id) : null,
        }),
      setBasketIdent: (ident) => set({ basketIdent: ident }),
      setUsername: (username, usernameId = null) => set({ username, usernameId }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      clearCart: () =>
        set({
          basketIdent: null,
          basket: null,
          username: null,
          usernameId: null,
        }),
      itemCount: () => {
        const basket = get().basket;
        if (!basket?.packages?.length) return 0;
        return basket.packages.reduce((sum, item) => sum + (item.qty ?? 1), 0);
      },
    }),
    {
      name: "lscnr-cart",
      partialize: (state) => ({
        basketIdent: state.basketIdent,
        username: state.username,
        usernameId: state.usernameId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function waitForCartHydration() {
  if (useCartStore.getState().hasHydrated || useCartStore.persist.hasHydrated()) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const unsub = useCartStore.persist.onFinishHydration(() => {
      unsub();
      useCartStore.getState().setHasHydrated(true);
      resolve();
    });
  });
}

export async function fetchBasket(ident: string) {
  const res = await fetch(`/api/basket/${ident}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch basket");
  const data = (await res.json()) as { data: TebexBasket };
  return data.data;
}

export async function ensureBasket(): Promise<string> {
  await waitForCartHydration();

  const store = useCartStore.getState();
  if (store.basketIdent) {
    try {
      const basket = await fetchBasket(store.basketIdent);
      store.setBasket(basket);
      return basket.ident;
    } catch {
      store.setBasketIdent(null);
    }
  }

  const res = await fetch("/api/basket", { method: "POST", cache: "no-store" });
  if (!res.ok) throw new Error("Failed to create basket");
  const data = (await res.json()) as { data: TebexBasket };
  store.setBasket(data.data);
  return data.data.ident;
}

export async function syncBasketAfterAuth(maxAttempts = 6) {
  await waitForCartHydration();

  const store = useCartStore.getState();
  const ident = store.basketIdent;
  if (!ident) return null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const basket = await fetchBasket(ident);
    store.setBasket(basket);

    if (basketHasAuth(basket)) {
      return basket;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return useCartStore.getState().basket;
}

export async function addToCart(packageId: number, quantity = 1) {
  const store = useCartStore.getState();
  store.setLoading(true);
  try {
    const ident = await ensureBasket();
    const res = await fetch(`/api/basket/${ident}/packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ package_id: packageId, quantity }),
    });
    if (!res.ok) throw new Error("Failed to add package");
    const data = (await res.json()) as { data: TebexBasket };
    store.setBasket(data.data);
    return data.data;
  } finally {
    store.setLoading(false);
  }
}

export async function removeFromCart(packageId: number) {
  const store = useCartStore.getState();
  const ident = store.basketIdent;
  if (!ident) return;

  store.setLoading(true);
  try {
    const res = await fetch(`/api/basket/${ident}/packages`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ package_id: packageId }),
    });
    if (!res.ok) throw new Error("Failed to remove package");
    const data = (await res.json()) as { data: TebexBasket };
    store.setBasket(data.data);
    return data.data;
  } finally {
    store.setLoading(false);
  }
}

export async function refreshBasket() {
  await waitForCartHydration();

  const store = useCartStore.getState();
  if (!store.basketIdent) return null;
  const basket = await fetchBasket(store.basketIdent);
  store.setBasket(basket);
  return basket;
}
