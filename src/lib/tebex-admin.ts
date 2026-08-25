/**
 * Tebex Plugin API client (server-only).
 *
 * Uses the game-server secret key (X-Tebex-Secret) and MUST never be called
 * from the browser. All access goes through /api/admin routes that first verify
 * the admin session.
 *
 * Docs: https://docs.tebex.io/plugin/
 */

const PLUGIN_API = "https://plugin.tebex.io";

export function getSecretKey() {
  return process.env.TEBEX_SECRET_KEY?.trim() ?? "";
}

export function isAdminApiConfigured() {
  return getSecretKey().length > 0;
}

export class TebexAdminError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "TebexAdminError";
  }
}

async function pluginFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = getSecretKey();
  if (!secret) {
    throw new TebexAdminError(500, "TEBEX_SECRET_KEY is not configured");
  }

  const headers = new Headers(init?.headers);
  headers.set("X-Tebex-Secret", secret);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${PLUGIN_API}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text || res.statusText;
    try {
      const parsed = JSON.parse(text) as { error_message?: string; message?: string };
      message = parsed.error_message || parsed.message || message;
    } catch {
      // keep raw text
    }
    throw new TebexAdminError(res.status, message);
  }

  if (res.status === 204) return null as T;
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

/* ----------------------------- Types ----------------------------- */

export interface TebexStoreInformation {
  account?: {
    id: number;
    domain: string;
    name: string;
    currency: { iso_4217: string; symbol: string };
    online_mode: boolean;
    game_type: string;
    log_events: boolean;
  };
  server?: { id: number; name: string };
}

export interface TebexCoupon {
  id: number;
  code: string;
  effective: { type: string; packages: number[]; categories: number[] };
  discount: { type: string; percentage: number; value: number };
  expire: { redeem_unlimited: string; expire_never: string; limit: number; date: string };
  basket_type: string;
  start_date: string;
  user_limit: number;
  minimum: number;
  username?: string;
  note?: string;
}

export interface TebexPaginated<T> {
  pagination?: {
    totalResults: number;
    currentPage: number;
    lastPage: number;
    previous: string | null;
    next: string | null;
  };
  data: T[];
}

export interface TebexGiftCard {
  id: number;
  code: string;
  balance: { starting: string; remaining: string; currency: string };
  note: string;
  void: boolean;
}

export interface TebexBan {
  id: number;
  time: string;
  ip: string;
  payment_email: string;
  reason: string;
  user: { ign: string | null; uuid: string | null };
}

export interface TebexSale {
  id: number;
  name: string;
  effective: { type: string; packages: number[]; categories: number[] };
  discount: { type: string; percentage: number; value: number };
  start: number;
  expire: number;
  order: number;
}

export interface TebexPayment {
  id: number;
  amount: string;
  date: string;
  currency: { iso_4217: string; symbol: string };
  gateway?: { id: number; name: string } | null;
  status: string;
  email?: string;
  player?: { id: number; name: string; uuid: string };
  packages?: { id: number; name: string }[];
}

/* --------------------------- Store info --------------------------- */

export function getStoreInformation() {
  return pluginFetch<TebexStoreInformation>("/information");
}

/* ----------------------------- Coupons ---------------------------- */

export function listCoupons(page = 1) {
  return pluginFetch<TebexPaginated<TebexCoupon>>(`/coupons?page=${page}`);
}

export interface CreateCouponInput {
  code: string;
  effective_on: "cart" | "package" | "category";
  packages?: number[];
  categories?: number[];
  discount_type: "percentage" | "value";
  discount_amount?: number;
  discount_percentage?: number;
  redeem_unlimited?: boolean;
  expire_never?: boolean;
  expire_limit?: number;
  expire_date?: string;
  start_date?: string;
  basket_type?: "single" | "subscription" | "both";
  minimum?: number;
  discount_application_method?: 0 | 1 | 2;
  username?: string;
  note?: string;
}

export function createCoupon(input: CreateCouponInput) {
  return pluginFetch<{ data: TebexCoupon }>("/coupons", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteCoupon(id: number | string) {
  return pluginFetch<null>(`/coupons/${id}`, { method: "DELETE" });
}

/* ---------------------------- Gift cards -------------------------- */

export function listGiftCards() {
  return pluginFetch<{ data: TebexGiftCard[] }>("/gift-cards");
}

export interface CreateGiftCardInput {
  amount: number;
  note?: string;
  expires_at?: string;
}

export function createGiftCard(input: CreateGiftCardInput) {
  return pluginFetch<{ data: TebexGiftCard }>("/gift-cards", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function voidGiftCard(id: number | string) {
  return pluginFetch<{ data: TebexGiftCard }>(`/gift-cards/${id}`, {
    method: "DELETE",
  });
}

export function topUpGiftCard(id: number | string, amount: number) {
  return pluginFetch<{ data: TebexGiftCard }>(`/gift-cards/${id}`, {
    method: "PUT",
    body: JSON.stringify({ amount: String(amount) }),
  });
}

/* ----------------------------- Packages --------------------------- */

export interface UpdatePackageInput {
  name?: string;
  price?: number;
  disabled?: boolean;
}

export function updatePackage(id: number | string, input: UpdatePackageInput) {
  return pluginFetch<null>(`/package/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

/* ------------------------------- Bans ----------------------------- */

export function listBans() {
  return pluginFetch<{ data: TebexBan[] }>("/bans");
}

export interface CreateBanInput {
  user: string;
  reason: string;
  ip?: string;
}

export function createBan(input: CreateBanInput) {
  return pluginFetch<{ data: TebexBan }>("/bans", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/* ------------------------------- Sales ---------------------------- */

export function listSales() {
  return pluginFetch<{ data: TebexSale[] }>("/sales");
}

/* ----------------------------- Payments --------------------------- */

export function listPayments(limit = 25) {
  return pluginFetch<TebexPayment[]>(`/payments?limit=${limit}`);
}
