import type {
  TebexApiResponse,
  TebexAuthProvider,
  TebexBasket,
  TebexCategory,
  TebexPackage,
} from "./tebex-types";
import { getSiteUrl } from "./site";

const TEBEX_API = "https://headless.tebex.io/api";

export function getPublicToken() {
  return process.env.NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN?.trim() ?? "";
}

function getPrivateKey() {
  return process.env.TEBEX_PRIVATE_KEY?.trim() ?? "";
}

function authHeader() {
  const token = getPublicToken();
  const key = getPrivateKey();
  if (!token || !key) {
    throw new Error("Tebex credentials are not configured");
  }
  const encoded = Buffer.from(`${token}:${key}`).toString("base64");
  return `Basic ${encoded}`;
}

type TebexFetchOptions = RequestInit & {
  auth?: boolean;
  /** When true, basket/catalog reads can be cached. Defaults to false for mutations. */
  revalidate?: number | false;
};

async function tebexFetch<T>(path: string, init?: TebexFetchOptions): Promise<T> {
  const token = getPublicToken();
  if (!token) {
    throw new Error("NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN is not configured");
  }

  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.auth) {
    headers.set("Authorization", authHeader());
  }

  const isGet = !init?.method || init.method === "GET";
  const revalidate = init?.revalidate ?? (isGet ? 300 : false);

  const res = await fetch(`${TEBEX_API}${path}`, {
    ...init,
    headers,
    ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate } }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Tebex API ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function isTebexConfigured() {
  return Boolean(getPublicToken());
}

export function normalizeAuthProviders(
  payload: TebexAuthProvider[] | { data?: TebexAuthProvider[] } | null | undefined
): TebexAuthProvider[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export function findAuthProvider(
  providers: TebexAuthProvider[],
  providerName: string
): TebexAuthProvider | undefined {
  const needle = providerName.toLowerCase();
  const aliases: Record<string, string[]> = {
    fivem: ["fivem", "cfx", "citizenfx", "rockstar", "rockstar games"],
    discord: ["discord"],
  };
  const terms = aliases[needle] ?? [needle];

  return providers.find((provider) => {
    const name = provider.name.toLowerCase();
    return terms.some((term) => name.includes(term));
  });
}

export async function getCategories(
  includePackages = true
): Promise<TebexCategory[]> {
  const token = getPublicToken();
  if (!token) return [];

  const query = includePackages ? "?includePackages=1" : "";
  const res = await tebexFetch<TebexApiResponse<TebexCategory[]>>(
    `/accounts/${token}/categories${query}`
  );
  return res.data ?? [];
}

export async function getCategoryById(
  categoryId: string | number,
  includePackages = true
): Promise<TebexCategory | null> {
  const token = getPublicToken();
  if (!token) return null;

  const query = includePackages ? "?includePackages=1" : "";
  const res = await tebexFetch<TebexApiResponse<TebexCategory[]>>(
    `/accounts/${token}/categories/${categoryId}${query}`
  );
  return res.data?.[0] ?? null;
}

export async function getCategoryBySlug(
  slug: string
): Promise<TebexCategory | null> {
  const categories = await getCategories(true);
  return (
    categories.find((c) => c.slug === slug) ??
    categories.find((c) => String(c.id) === slug) ??
    null
  );
}

export async function getPackageById(
  packageId: string | number
): Promise<TebexPackage | null> {
  const token = getPublicToken();
  if (!token) return null;

  const res = await tebexFetch<TebexApiResponse<TebexPackage>>(
    `/accounts/${token}/packages/${packageId}`
  );
  return res.data ?? null;
}

export async function getAllPackages(): Promise<TebexPackage[]> {
  const categories = await getCategories(true);
  const packages: TebexPackage[] = [];
  const seen = new Set<number>();

  for (const category of categories) {
    for (const pkg of category.packages ?? []) {
      if (!seen.has(pkg.id)) {
        seen.add(pkg.id);
        packages.push(pkg);
      }
    }
  }

  return packages.sort((a, b) => a.order - b.order);
}

export async function createBasket(): Promise<TebexBasket> {
  const token = getPublicToken();
  const siteUrl = getSiteUrl();

  const res = await tebexFetch<TebexApiResponse<TebexBasket>>(
    `/accounts/${token}/baskets`,
    {
      method: "POST",
      auth: true,
      revalidate: false,
      body: JSON.stringify({
        complete_url: `${siteUrl}/checkout/complete`,
        cancel_url: `${siteUrl}/checkout/cancel`,
        complete_auto_redirect: true,
      }),
    }
  );

  return res.data;
}

export async function getBasket(ident: string): Promise<TebexBasket> {
  const token = getPublicToken();
  const res = await tebexFetch<TebexApiResponse<TebexBasket>>(
    `/accounts/${token}/baskets/${ident}`,
    { revalidate: false }
  );
  return res.data;
}

export async function addPackageToBasket(
  ident: string,
  packageId: number,
  quantity = 1
): Promise<TebexBasket> {
  const res = await tebexFetch<{ data: TebexBasket }>(
    `/baskets/${ident}/packages`,
    {
      method: "POST",
      auth: true,
      revalidate: false,
      body: JSON.stringify({ package_id: String(packageId), quantity }),
    }
  );
  return res.data;
}

export async function removePackageFromBasket(
  ident: string,
  packageId: number
): Promise<TebexBasket> {
  const res = await tebexFetch<{ data: TebexBasket }>(
    `/baskets/${ident}/packages/remove`,
    {
      method: "POST",
      auth: true,
      revalidate: false,
      body: JSON.stringify({ package_id: String(packageId) }),
    }
  );
  return res.data;
}

export async function applyCoupon(
  ident: string,
  couponCode: string
): Promise<TebexBasket> {
  const token = getPublicToken();
  const res = await tebexFetch<{ data: TebexBasket }>(
    `/accounts/${token}/baskets/${ident}/coupons`,
    {
      method: "POST",
      auth: true,
      revalidate: false,
      body: JSON.stringify({ coupon_code: couponCode }),
    }
  );
  return res.data;
}

export async function removeCoupon(
  ident: string,
  couponCode: string
): Promise<TebexBasket> {
  const token = getPublicToken();
  const res = await tebexFetch<{ data: TebexBasket }>(
    `/accounts/${token}/baskets/${ident}/coupons/remove`,
    {
      method: "POST",
      auth: true,
      revalidate: false,
      body: JSON.stringify({ coupon_code: couponCode }),
    }
  );
  return res.data;
}

export async function applyGiftCard(
  ident: string,
  cardNumber: string
): Promise<TebexBasket> {
  const token = getPublicToken();
  const res = await tebexFetch<{ data: TebexBasket }>(
    `/accounts/${token}/baskets/${ident}/giftcards`,
    {
      method: "POST",
      auth: true,
      revalidate: false,
      body: JSON.stringify({ card_number: cardNumber }),
    }
  );
  return res.data;
}

export async function applyCreatorCode(
  ident: string,
  creatorCode: string
): Promise<TebexBasket> {
  const token = getPublicToken();
  const res = await tebexFetch<{ data: TebexBasket }>(
    `/accounts/${token}/baskets/${ident}/creator-codes`,
    {
      method: "POST",
      auth: true,
      revalidate: false,
      body: JSON.stringify({ creator_code: creatorCode }),
    }
  );
  return res.data;
}

export async function getBasketAuthUrls(
  ident: string,
  returnUrl: string
): Promise<TebexAuthProvider[]> {
  const token = getPublicToken();
  const encodedReturn = encodeURIComponent(returnUrl);
  const res = await tebexFetch<
    TebexAuthProvider[] | { data?: TebexAuthProvider[] }
  >(`/accounts/${token}/baskets/${ident}/auth?returnUrl=${encodedReturn}`, {
    revalidate: false,
  });
  return normalizeAuthProviders(res);
}

export function categoryHref(category: TebexCategory) {
  return `/categories/${category.slug ?? category.id}`;
}

export function getTopCategories(categories: TebexCategory[]) {
  return categories
    .filter((c) => !c.parent)
    .sort((a, b) => a.order - b.order);
}

export function packageHref(pkg: TebexPackage) {
  return `/packages/${pkg.id}`;
}

export function basketHasAuth(basket: TebexBasket) {
  return Boolean(basket.username || basket.username_id);
}
