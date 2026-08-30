"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { launchTebexCheckout } from "@/components/providers/TebexScript";
import { isGiftcardName } from "@/lib/package-kind";
import type { TebexBasket, TebexBasketPackage, TebexPackage } from "@/lib/tebex-types";

const LAST_AUTH_KEY = "lscnr-last-auth";
const PENDING_CHECKOUT_KEY = "lscnr-pending-checkout";
const BASKET_IDENT_KEY = "lscnr-basket-ident";

export type LocalCartItem = {
  packageId: number;
  quantity: number;
  type: string;
  name: string;
  image: string | null;
  price: number;
  originalPrice?: number | null;
  currency: string;
  needsDiscord?: boolean;
};

type Notice = { tone: "ok" | "error"; message: string } | null;

interface CartState {
  basketIdent: string | null;
  basket: TebexBasket | null;
  localItems: LocalCartItem[];
  username: string | null;
  usernameId: string | null;
  discordId: string | null;
  discordUsername: string | null;
  email: string | null;
  giftRecipientEmail: string | null;
  couponCode: string;
  notice: Notice;
  linkingMessage: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  setBasket: (basket: TebexBasket) => void;
  setBasketIdent: (ident: string | null) => void;
  setUsername: (username: string | null, usernameId?: string | null) => void;
  setDiscordId: (discordId: string | null) => void;
  setDiscordAccount: (discordId: string | null, discordUsername?: string | null) => void;
  setEmail: (email: string | null) => void;
  setGiftRecipientEmail: (email: string | null) => void;
  setCouponCode: (couponCode: string) => void;
  setNotice: (notice: Notice) => void;
  setLinkingMessage: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  addLocalItem: (item: LocalCartItem) => void;
  removeLocalItem: (packageId: number) => void;
  signOut: () => void;
  clearPaidCart: () => void;
  itemCount: () => number;
}

function readSession(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function clearSession(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function rememberIdent(ident: string) {
  writeSession(BASKET_IDENT_KEY, ident);
}

function readSessionIdent() {
  return readSession(BASKET_IDENT_KEY);
}

function rememberCheckout() {
  writeSession(PENDING_CHECKOUT_KEY, "1");
}

function takeCheckout() {
  const pending = readSession(PENDING_CHECKOUT_KEY) === "1";
  clearSession(PENDING_CHECKOUT_KEY);
  return pending;
}

function clearAuthSession() {
  clearSession(LAST_AUTH_KEY);
  clearSession(PENDING_CHECKOUT_KEY);
  clearSession(BASKET_IDENT_KEY);
}

export function isValidEmail(value: string | null | undefined) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

export function isValidDiscordId(value: string | null | undefined) {
  return /^\d{17,20}$/.test(String(value ?? "").trim());
}

export function packageNeedsDiscord(
  pkg: Pick<TebexPackage, "name" | "type" | "options">
) {
  if (isGiftcardName(pkg.name) || pkg.options?.some((option) => option.name === "giftcard_to")) {
    return false;
  }
  return true;
}

export function itemNeedsDiscord(item: LocalCartItem) {
  return !isGiftcardName(item.name);
}

export function cartNeedsDiscord(items?: LocalCartItem[]) {
  return (items ?? useCartStore.getState().localItems).some(itemNeedsDiscord);
}

export function cartNeedsFiveM(items?: LocalCartItem[]) {
  return (items ?? useCartStore.getState().localItems).some((item) => !isGiftcardName(item.name));
}

export function cartHasGiftcard(items?: LocalCartItem[]) {
  return (items ?? useCartStore.getState().localItems).some((item) => isGiftcardName(item.name));
}

function basketHasAuth(basket: TebexBasket) {
  return Boolean(basket.username || basket.username_id);
}

function packageIdFromLine(item: TebexBasketPackage) {
  return item.package?.id ?? item.id;
}

function stripAuthParams() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    url.searchParams.delete("discord");
    url.searchParams.delete("success");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next);
  } catch {
    // ignore
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      basketIdent: null,
      basket: null,
      localItems: [],
      username: null,
      usernameId: null,
      discordId: null,
      discordUsername: null,
      email: null,
      giftRecipientEmail: null,
      couponCode: "",
      notice: null,
      linkingMessage: null,
      isLoading: false,
      hasHydrated: false,
      setBasket: (basket) => {
        const discordReturn = readSession(LAST_AUTH_KEY) === "discord";
        rememberIdent(basket.ident);
        set({
          basket,
          basketIdent: basket.ident,
          ...(discordReturn
            ? {
                discordId:
                  basket.username_id != null ? String(basket.username_id) : get().discordId,
              }
            : {
                username: basket.username ?? null,
                usernameId: basket.username_id != null ? String(basket.username_id) : null,
              }),
        });
      },
      setBasketIdent: (ident) => {
        if (ident) rememberIdent(ident);
        else clearSession(BASKET_IDENT_KEY);
        set({ basketIdent: ident });
      },
      setUsername: (username, usernameId = null) => set({ username, usernameId }),
      setDiscordId: (discordId) => set({ discordId, discordUsername: discordId ? get().discordUsername : null }),
      setDiscordAccount: (discordId, discordUsername = null) => set({ discordId, discordUsername }),
      setEmail: (email) => set({ email }),
      setGiftRecipientEmail: (giftRecipientEmail) => set({ giftRecipientEmail }),
      setCouponCode: (couponCode) => set({ couponCode }),
      setNotice: (notice) => set({ notice }),
      setLinkingMessage: (linkingMessage) => set({ linkingMessage }),
      setLoading: (isLoading) => set({ isLoading }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      addLocalItem: (item) =>
        set((state) => {
          const existing = state.localItems.find((row) => row.packageId === item.packageId);
          if (!existing) {
            return { localItems: [...state.localItems, { ...item, quantity: item.quantity || 1 }] };
          }
          return {
            localItems: state.localItems.map((row) =>
              row.packageId === item.packageId
                ? {
                    ...row,
                    quantity: row.quantity + (item.quantity || 1),
                    price: item.price,
                    originalPrice: item.originalPrice,
                  }
                : row
            ),
          };
        }),
      removeLocalItem: (packageId) =>
        set((state) => ({
          localItems: state.localItems.filter((row) => row.packageId !== packageId),
        })),
      signOut: () => {
        clearAuthSession();
        set({
          basketIdent: null,
          basket: null,
          username: null,
          usernameId: null,
          discordId: null,
          discordUsername: null,
          email: null,
          giftRecipientEmail: null,
          couponCode: "",
          notice: null,
          linkingMessage: null,
        });
      },
      clearPaidCart: () => {
        clearSession(BASKET_IDENT_KEY);
        set({
          localItems: [],
          basket: null,
          basketIdent: null,
          couponCode: "",
        });
      },
      itemCount: () => get().localItems.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "lscnr-cart",
      version: 4,
      partialize: (state) => ({
        basketIdent: state.basketIdent,
        localItems: state.localItems,
        username: state.username,
        usernameId: state.usernameId,
        discordId: state.discordId,
        discordUsername: state.discordUsername,
        email: state.email,
        giftRecipientEmail: state.giftRecipientEmail,
        couponCode: state.couponCode,
      }),
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>;
        let next = state;
        if (version < 2) {
          next = { ...next, basketIdent: null, basket: null };
        }
        if (version < 3) {
          const id = String(next.discordId ?? "");
          if (!/^\d{17,20}$/.test(id)) {
            next = { ...next, discordId: null, discordUsername: null };
          }
        }
        if (version < 4) {
          next = { ...next, giftRecipientEmail: next.giftRecipientEmail ?? null };
        }
        return next;
      },
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

export function addToCart(
  pkg: Pick<
    TebexPackage,
    "id" | "name" | "image" | "type" | "total_price" | "original_price" | "currency" | "options"
  >,
  quantity = 1
) {
  useCartStore.getState().addLocalItem({
    packageId: pkg.id,
    quantity,
    type: pkg.type || "single",
    name: pkg.name,
    image: pkg.image,
    price: pkg.total_price,
    originalPrice: pkg.original_price,
    currency: pkg.currency,
    needsDiscord: packageNeedsDiscord(pkg),
  });
  useCartStore.getState().setNotice({ tone: "ok", message: `${pkg.name} added to cart.` });
}

export function removeFromCart(packageId: number) {
  useCartStore.getState().removeLocalItem(packageId);
}

export function signOutCart() {
  useCartStore.getState().signOut();
  fetch("/api/discord/me", { method: "DELETE", cache: "no-store" }).catch(() => undefined);
}

export async function beginDiscordOAuth(options?: {
  pendingCheckout?: boolean;
  returnUrl?: string;
}) {
  const returnUrl = options?.returnUrl ?? `${window.location.origin}/cart`;
  const params = new URLSearchParams({ returnUrl });
  if (options?.pendingCheckout) params.set("checkout", "1");
  window.location.href = `/api/discord/login?${params}`;
}

export async function finishDiscordReturn() {
  const store = useCartStore.getState();
  store.setLinkingMessage("Linking Discord…");
  try {
    const res = await fetch("/api/discord/me", { cache: "no-store" });
    const data = (await res.json().catch(() => null)) as {
      id?: string | null;
      username?: string | null;
    } | null;
    if (!data?.id) {
      throw new Error("Discord login did not finish.");
    }
    store.setDiscordAccount(data.id, data.username ?? null);
    store.setNotice({ tone: "ok", message: `Discord linked as ${data.username || "your account"}.` });
    let resume = false;
    try {
      const url = new URL(window.location.href);
      resume = url.searchParams.get("checkout") === "1";
      url.searchParams.delete("discord");
      url.searchParams.delete("checkout");
      url.searchParams.delete("discord_error");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // ignore
    }
    store.setLinkingMessage(null);
    if (resume) await startCheckout();
  } catch (error) {
    store.setLinkingMessage(null);
    store.setNotice({
      tone: "error",
      message: error instanceof Error ? error.message : "Discord login did not finish.",
    });
  }
}

export async function beginBasketAuth(options?: {
  provider?: string;
  returnUrl?: string;
  pendingCheckout?: boolean;
}) {
  const ident = await ensureBasket();
  if (options?.pendingCheckout) rememberCheckout();
  rememberIdent(ident);

  const returnUrl = new URL(
    options?.returnUrl ?? `${window.location.origin}${window.location.pathname}${window.location.search}`
  );
  returnUrl.searchParams.set("auth", "1");

  const provider = options?.provider ?? "fivem";
  if (provider === "discord") {
    await beginDiscordOAuth({
      pendingCheckout: options?.pendingCheckout,
      returnUrl: options?.returnUrl,
    });
    return;
  }

  const res = await fetch(
    `/api/basket/${ident}/auth?returnUrl=${encodeURIComponent(returnUrl.toString())}&provider=${encodeURIComponent(provider)}`,
    { cache: "no-store" }
  );
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    provider?: { name: string; url: string };
    providers?: { name: string; url: string }[];
  } | null;
  if (!res.ok) {
    throw new Error(data?.error || "Could not start FiveM login");
  }

  const url =
    data?.provider?.url ??
    data?.providers?.find((item) => item.name.toLowerCase().includes(provider))?.url;

  if (!url) {
    throw new Error("FiveM login is not available for this store");
  }
  writeSession(LAST_AUTH_KEY, provider);
  window.location.href = url;
}

export async function finishAuthReturn() {
  const lastAuth = readSession(LAST_AUTH_KEY);
  const store = useCartStore.getState();

  if (lastAuth === "discord") {
    clearSession(LAST_AUTH_KEY);
    stripAuthParams();
    store.setLinkingMessage(null);
    if (takeCheckout()) await startCheckout();
    return;
  }

  store.setLinkingMessage("Linking FiveM…");
  await syncBasketAfterAuth();
  clearSession(LAST_AUTH_KEY);
  stripAuthParams();
  store.setLinkingMessage(null);
  if (takeCheckout()) await startCheckout();
}

export async function ensureBasket(): Promise<string> {
  await waitForCartHydration();

  const store = useCartStore.getState();
  const ident = store.basketIdent ?? readSessionIdent();
  if (ident) {
    try {
      const basket = await fetchBasket(ident);
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
  rememberIdent(data.data.ident);
  return data.data.ident;
}

export async function syncBasketAfterAuth(maxAttempts = 6) {
  await waitForCartHydration();

  const store = useCartStore.getState();
  const ident = store.basketIdent ?? readSessionIdent();
  if (!ident) return null;
  if (ident !== store.basketIdent) store.setBasketIdent(ident);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const basket = await fetchBasket(ident);
    store.setBasket(basket);
    if (basketHasAuth(basket)) return basket;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return useCartStore.getState().basket;
}

export async function refreshBasket() {
  await waitForCartHydration();
  const store = useCartStore.getState();
  const ident = store.basketIdent ?? readSessionIdent();
  if (!ident) return null;
  try {
    const basket = await fetchBasket(ident);
    store.setBasket(basket);
    return basket;
  } catch {
    store.setBasketIdent(null);
    return null;
  }
}

async function resetTebexPackages(ident: string) {
  const basket = await fetchBasket(ident);
  for (const item of basket.packages ?? []) {
    const id = packageIdFromLine(item);
    if (!id) continue;
    await fetch(`/api/basket/${ident}/packages`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ package_id: id }),
    }).catch(() => undefined);
  }
}

async function pushLocalItemsToTebex(ident: string) {
  const store = useCartStore.getState();
  const discordId = store.discordId;
  const email = store.email;
  const giftTo = store.giftRecipientEmail?.trim() || email;
  let last: TebexBasket | null = null;

  await resetTebexPackages(ident);

  for (const item of store.localItems) {
    const res = await fetch(`/api/basket/${ident}/packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        package_id: item.packageId,
        quantity: item.quantity,
        type: item.type,
        email,
        discord_id: discordId,
        giftcard_to: isGiftcardName(item.name) ? giftTo : undefined,
      }),
    });
    const payload = (await res.json().catch(() => null)) as
      | { data?: TebexBasket; error?: string }
      | null;
    if (!res.ok || !payload?.data) {
      throw new Error(payload?.error || `Could not add ${item.name}`);
    }
    last = payload.data;
    store.setBasket(payload.data);
  }

  const coupon = store.couponCode.trim();
  if (coupon && last) {
    const couponRes = await fetch(`/api/basket/${ident}/coupons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ coupon_code: coupon }),
    });
    if (couponRes.ok) {
      const couponPayload = (await couponRes.json()) as { data?: TebexBasket };
      if (couponPayload.data) {
        last = couponPayload.data;
        store.setBasket(couponPayload.data);
      }
    } else {
      throw new Error("Could not apply that coupon code.");
    }
  }

  return last;
}

export async function startCheckout() {
  const store = useCartStore.getState();
  if (!store.localItems.length) {
    store.setNotice({ tone: "error", message: "Your cart is empty." });
    return;
  }

  store.setLoading(true);
  store.setNotice(null);
  try {
    if (!isValidEmail(store.email)) {
      store.setNotice({ tone: "error", message: "Enter your email to check out." });
      return;
    }
    if (cartNeedsDiscord() && !isValidDiscordId(store.discordId)) {
      store.setLinkingMessage("Link Discord to continue…");
      await beginDiscordOAuth({
        pendingCheckout: true,
        returnUrl: `${window.location.origin}/cart`,
      });
      return;
    }
    if (cartHasGiftcard() && !isValidEmail(store.giftRecipientEmail || store.email)) {
      store.setNotice({
        tone: "error",
        message: "Enter the email that should receive the gift card code.",
      });
      return;
    }
    if (cartNeedsFiveM() && !store.username && !store.usernameId) {
      store.setLinkingMessage("Link FiveM to continue…");
      await beginBasketAuth({
        provider: "fivem",
        pendingCheckout: true,
        returnUrl: `${window.location.origin}/cart`,
      });
      return;
    }

    const ident = await ensureBasket();
    const live = useCartStore.getState().basket;
    if (cartNeedsFiveM() && (!live || !basketHasAuth(live))) {
      await beginBasketAuth({
        provider: "fivem",
        pendingCheckout: true,
        returnUrl: `${window.location.origin}/cart`,
      });
      return;
    }

    await pushLocalItemsToTebex(ident);
    const checkoutUrl = useCartStore.getState().basket?.links?.checkout;
    await launchTebexCheckout(ident, {
      checkoutUrl,
      onPaid: () => useCartStore.getState().clearPaidCart(),
    });
  } catch (error) {
    store.setNotice({
      tone: "error",
      message: error instanceof Error ? error.message : "Checkout could not be started.",
    });
  } finally {
    store.setLoading(false);
    if (!readSession(LAST_AUTH_KEY)) store.setLinkingMessage(null);
  }
}
