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

type PluginFetchInit = RequestInit & { revalidate?: number | false };

async function pluginFetch<T>(path: string, init?: PluginFetchInit): Promise<T> {
  const secret = getSecretKey();
  if (!secret) {
    throw new TebexAdminError(500, "TEBEX_SECRET_KEY is not configured");
  }

  const { revalidate = false, ...rest } = init ?? {};
  const headers = new Headers(rest.headers);
  headers.set("X-Tebex-Secret", secret);
  headers.set("Accept", "application/json");
  if (rest.body) headers.set("Content-Type", "application/json");

  const res = await fetch(`${PLUGIN_API}${path}`, {
    ...rest,
    headers,
    ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate } }),
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
  packages?: { id: number; name: string; quantity?: number; qty?: number }[];
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

export function isSaleLive(sale: TebexSale, now = Math.floor(Date.now() / 1000)) {
  const started = !sale.start || sale.start <= now;
  const unexpired = !sale.expire || sale.expire > now;
  return started && unexpired;
}

export function formatSaleBanner(sale: TebexSale) {
  const name = sale.name?.trim() ?? "";
  const discount =
    sale.discount?.type === "percentage" && sale.discount.percentage
      ? `${sale.discount.percentage}% off`
      : sale.discount?.value
        ? `${sale.discount.value} off`
        : "";
  if (name && discount) return `${name} · ${discount}`;
  return name || discount;
}

export async function listActiveSales() {
  if (!isAdminApiConfigured()) return [];
  const payload = await pluginFetch<{ data: TebexSale[] }>("/sales", { revalidate: 60 });
  return (payload?.data ?? [])
    .filter((sale) => isSaleLive(sale))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.expire - a.expire);
}

/* ----------------------------- Payments --------------------------- */

export interface TebexPaymentsPaged {
  total?: number;
  per_page?: number;
  current_page?: number;
  last_page?: number;
  pagination?: { lastPage?: number; currentPage?: number };
  data?: TebexPayment[];
}

export async function listPayments(
  limit = 25,
  init?: { revalidate?: number | false }
) {
  const payload = await pluginFetch<TebexPayment[] | TebexPaginated<TebexPayment>>(
    `/payments?limit=${limit}`,
    init
  );
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function paymentsFromPaged(payload: TebexPayment[] | TebexPaymentsPaged | null) {
  if (Array.isArray(payload)) return { payments: payload, lastPage: 1 };
  const payments = payload?.data ?? [];
  const lastPage = Number(payload?.last_page ?? payload?.pagination?.lastPage ?? 1);
  return { payments, lastPage: Number.isFinite(lastPage) && lastPage > 0 ? lastPage : 1 };
}

/** Cached history used to rank supporters. Caps pages so the page stays fast. */
export async function listPaymentsHistory(maxPages = 40) {
  try {
    const first = await pluginFetch<TebexPayment[] | TebexPaymentsPaged>(
      "/payments?paged=1&page=1",
      { revalidate: 3600 }
    );
    const parsed = paymentsFromPaged(first);
    const lastPage = Math.min(parsed.lastPage, maxPages);
    const payments = [...parsed.payments];

    const batchSize = 5;
    for (let page = 2; page <= lastPage; page += batchSize) {
      const pages = Array.from(
        { length: Math.min(batchSize, lastPage - page + 1) },
        (_, index) => page + index
      );
      const batch = await Promise.all(
        pages.map((pageNumber) =>
          pluginFetch<TebexPayment[] | TebexPaymentsPaged>(
            `/payments?paged=1&page=${pageNumber}`,
            { revalidate: 3600 }
          ).catch(() => null)
        )
      );
      for (const payload of batch) {
        payments.push(...paymentsFromPaged(payload).payments);
      }
    }

    return payments;
  } catch (error) {
    console.error("payments history:", error);
    return listPayments(100, { revalidate: 3600 });
  }
}

export function getPayment(transaction: string) {
  return pluginFetch<TebexPayment>(`/payments/${encodeURIComponent(transaction)}`);
}

export interface TebexPlayerLookupPayment {
  txn_id: string;
  time: number;
  price: number;
  currency: string;
  status: number;
}

export interface TebexPlayerLookup {
  player?: {
    id?: string;
    username?: string;
    plugin_username_id?: number;
  };
  payments?: TebexPlayerLookupPayment[];
}

export function lookupPlayer(user: string) {
  return pluginFetch<TebexPlayerLookup>(`/user/${encodeURIComponent(user)}`);
}

export interface TebexPlayerPackage {
  txn_id: string;
  date: string;
  quantity?: number;
  package?: { id: number; name: string };
}

export function getPlayerPackages(playerId: string) {
  return pluginFetch<TebexPlayerPackage[]>(
    `/player/${encodeURIComponent(playerId)}/packages`
  );
}
