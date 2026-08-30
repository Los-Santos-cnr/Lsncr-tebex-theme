import type {
  TebexApiResponse,
  TebexAuthProvider,
  TebexBasket,
  TebexBasketPackage,
  TebexCategory,
  TebexPackage,
  TebexPackageOption,
} from "./tebex-types";
import { applySaleToPackage, applySalesToCategories } from "./package-sales";
import { isGiftcardName } from "./package-kind";
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
    throw new Error(parseTebexError(text, res.status));
  }

  return res.json() as Promise<T>;
}

async function getLiveSales() {
  try {
    const { listActiveSales } = await import("./tebex-admin");
    return await listActiveSales();
  } catch {
    return [];
  }
}

export function isTebexConfigured() {
  return Boolean(getPublicToken());
}

function parseTebexError(text: string, status: number) {
  if (text) {
    try {
      const payload = JSON.parse(text) as {
        detail?: string;
        message?: string;
        title?: string;
        error?: string;
      };
      const message =
        payload.detail || payload.message || payload.title || payload.error;
      if (message) return message;
    } catch {
      if (text.length < 280) return text;
    }
  }
  return `Tebex API ${status}`;
}

export function isBasketAuthError(message: string) {
  return /logged in|log in|login|identif|username|authenti/i.test(message);
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
    `/accounts/${token}/categories${query}`,
    { revalidate: includePackages ? 60 : 300 }
  );
  const categories = res.data ?? [];
  if (!includePackages) return categories;
  return applySalesToCategories(categories, await getLiveSales());
}

export async function getCategoryById(
  categoryId: string | number,
  includePackages = true
): Promise<TebexCategory | null> {
  const token = getPublicToken();
  if (!token) return null;

  const query = includePackages ? "?includePackages=1" : "";
  const res = await tebexFetch<TebexApiResponse<TebexCategory[]>>(
    `/accounts/${token}/categories/${categoryId}${query}`,
    { revalidate: includePackages ? 60 : 300 }
  );
  const category = res.data?.[0] ?? null;
  if (!category || !includePackages) return category;
  return applySalesToCategories([category], await getLiveSales())[0] ?? category;
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

  const res = await tebexFetch<TebexApiResponse<TebexPackage | TebexPackage[]>>(
    `/accounts/${token}/packages/${packageId}`,
    { revalidate: false }
  );
  const payload = res.data;
  const list = Array.isArray(payload) ? payload : payload ? [payload] : [];
  const wanted = Number(packageId);
  const pkg =
    list.find((item) => Number(item.id) === wanted) ??
    (list.length === 1 ? list[0] : null);
  if (!pkg) return null;
  return applySaleToPackage(pkg, await getLiveSales());
}

export function isDiscordPackageOption(option: TebexPackageOption) {
  return option.name === "discord_id" || option.type === "discord_id";
}

export function isGiftcardEmailOption(option: TebexPackageOption) {
  return option.name === "giftcard_to";
}

export function isGiftcardPackage(
  pkg: { name?: string; options?: TebexPackageOption[] } | null | undefined
) {
  if (!pkg) return false;
  if (pkg.options?.some(isGiftcardEmailOption)) return true;
  return isGiftcardName(pkg.name);
}

export function requiredPackageOptions(pkg: TebexPackage | null | undefined): TebexPackageOption[] {
  if (!pkg?.options?.length) return [];
  return pkg.options.filter(
    (option) => option.required || isDiscordPackageOption(option) || isGiftcardEmailOption(option)
  );
}

export function allowedVariableData(
  pkg: TebexPackage | null | undefined,
  data: Record<string, string> = {}
) {
  const allowed = new Set((pkg?.options ?? []).map((option) => option.name));
  return Object.fromEntries(
    Object.entries(data).filter(
      ([key, value]) => allowed.has(key) && String(value ?? "").trim()
    )
  );
}

export function missingPackageOptions(
  pkg: TebexPackage | null | undefined,
  data: Record<string, string> = {}
) {
  return requiredPackageOptions(pkg).filter((option) => !String(data[option.name] ?? "").trim());
}

export class PackageOptionsNeededError extends Error {
  readonly code = "OPTIONS_REQUIRED";
  constructor(
    public options: TebexPackageOption[],
    public packageType?: string
  ) {
    super("This package needs extra details.");
    this.name = "PackageOptionsNeededError";
  }
}

export function packageNeedsBillingEmail(pkg: TebexPackage | null | undefined) {
  return (
    pkg?.type === "subscription" &&
    Boolean(pkg.options?.some((option) => isDiscordPackageOption(option)))
  );
}

export function checkoutVariableData(
  pkg: TebexPackage | null | undefined,
  ids: { discordId?: string | null; email?: string | null }
) {
  const data: Record<string, string> = {};
  if (ids.discordId) data.discord_id = String(ids.discordId);
  if (ids.email) data.giftcard_to = String(ids.email);
  return allowedVariableData(pkg, data);
}

export async function updateBasketEmail(ident: string, email: string) {
  const token = getPublicToken();
  const body = JSON.stringify({ email });
  try {
    const res = await tebexFetch<TebexApiResponse<TebexBasket>>(
      `/accounts/${token}/baskets/${ident}`,
      { method: "PUT", auth: true, revalidate: false, body }
    );
    return res.data;
  } catch {
    const res = await tebexFetch<TebexApiResponse<TebexBasket>>(
      `/accounts/${token}/baskets/${ident}`,
      { method: "PATCH", auth: true, revalidate: false, body }
    );
    return res.data;
  }
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

export async function getCatalogSaleBanner() {
  const packages = await getAllPackages().catch(() => []);
  const onSale = packages.filter((pkg) => pkg.sale?.active || (pkg.discount ?? 0) > 0);
  if (!onSale.length) return "";

  const percents = onSale
    .map((pkg) => {
      if (pkg.sale?.discount && pkg.sale.discount > 0 && pkg.sale.discount <= 100) return pkg.sale.discount;
      if (pkg.discount > 0 && pkg.discount <= 100) return Math.round(pkg.discount);
      if (pkg.base_price > 0 && pkg.total_price < pkg.base_price) {
        return Math.round((1 - pkg.total_price / pkg.base_price) * 100);
      }
      return 0;
    })
    .filter((value) => value > 0);

  const unique = [...new Set(percents)].sort((a, b) => b - a);
  if (unique.length === 1) return `Sale · ${unique[0]}% off`;
  if (unique.length > 1) return `Sale · up to ${unique[0]}% off`;
  return "Sale now on";
}

export type TebexSidebarPayment = {
  username?: string;
  username_id?: string;
  avatar_url?: string;
  package?: { id?: number; name?: string };
  created_at?: string | null;
};

export async function getSidebarRecentPayments(): Promise<TebexSidebarPayment[]> {
  const token = getPublicToken();
  if (!token) return [];

  const res = await tebexFetch<{
    data?: Array<{ type?: string; data?: { payments?: TebexSidebarPayment[] } }>;
  }>(`/accounts/${token}/sidebar`, { revalidate: 30 });

  const module = (res.data ?? []).find((item) => item.type === "recent_payments");
  return module?.data?.payments ?? [];
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
  quantity = 1,
  options?: {
    type?: string;
    variable_data?: Record<string, string>;
  }
): Promise<TebexBasket> {
  const body: Record<string, unknown> = {
    package_id: String(packageId),
    quantity,
  };
  if (options?.type === "subscription" || options?.type === "single") {
    body.type = options.type;
  }
  if (options?.variable_data && Object.keys(options.variable_data).length) {
    body.variable_data = options.variable_data;
  }

  const res = await tebexFetch<{ data: TebexBasket }>(
    `/baskets/${ident}/packages`,
    {
      method: "POST",
      auth: true,
      revalidate: false,
      body: JSON.stringify(body),
    }
  );
  return res.data;
}

export async function addCatalogPackageToBasket(
  ident: string,
  packageId: number,
  quantity = 1,
  extras?: {
    type?: string;
    variable_data?: Record<string, string>;
    email?: string;
  }
): Promise<TebexBasket> {
  const pkg = await getPackageById(packageId);
  const type =
    pkg?.type === "subscription" || pkg?.type === "single"
      ? pkg.type
      : extras?.type === "subscription" || extras?.type === "single"
        ? extras.type
        : undefined;
  if (extras?.email) {
    await updateBasketEmail(ident, extras.email).catch(() => undefined);
  }
  const variable_data = checkoutVariableData(pkg, {
    discordId: extras?.variable_data?.discord_id,
    email: extras?.email ?? extras?.variable_data?.giftcard_to,
  });

  const missing = missingPackageOptions(pkg, variable_data);
  if (missing.length) {
    throw new PackageOptionsNeededError(missing, type);
  }

  return addPackageToBasket(ident, packageId, quantity, { type, variable_data });
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

export function packagesForTopCategory(
  category: TebexCategory,
  allCategories: TebexCategory[]
): TebexPackage[] {
  const seen = new Set<number>();
  const out: TebexPackage[] = [];

  const walk = (cat: TebexCategory) => {
    for (const pkg of cat.packages ?? []) {
      if (!seen.has(pkg.id)) {
        seen.add(pkg.id);
        out.push(pkg);
      }
    }
    for (const child of allCategories) {
      if (child.parent?.id === cat.id) walk(child);
    }
  };

  walk(category);
  return out.sort((a, b) => a.order - b.order);
}

export function packageHref(pkg: Pick<TebexPackage, "id">) {
  return `/packages/${pkg.id}`;
}

export function getBasketLine(item: TebexBasketPackage) {
  const nested = item.package;
  return {
    id: nested?.id ?? item.id,
    name: nested?.name ?? item.name ?? "Package",
    image: nested?.image ?? item.image ?? null,
    qty: item.in_basket?.quantity ?? item.qty ?? 1,
    price: item.in_basket?.price ?? nested?.total_price ?? 0,
    currency: nested?.currency,
  };
}

export function basketItemCount(packages: TebexBasketPackage[] | undefined | null) {
  if (!packages?.length) return 0;
  return packages.reduce((sum, item) => sum + getBasketLine(item).qty, 0);
}

const MEMBERSHIP_TIERS: { pattern: RegExp; rank: number }[] = [
  { pattern: /\bbronze\b/i, rank: 1 },
  { pattern: /\bsilver\b/i, rank: 2 },
  { pattern: /\bgold\b/i, rank: 3 },
  { pattern: /\bplatinum\b/i, rank: 4 },
];

function membershipRank(name: string) {
  return MEMBERSHIP_TIERS.find(({ pattern }) => pattern.test(name))?.rank ?? 100;
}

export function getMembershipPackages(packages: TebexPackage[]): TebexPackage[] {
  const seen = new Set<number>();
  const picked: TebexPackage[] = [];

  for (const { pattern } of MEMBERSHIP_TIERS) {
    const pkg = packages.find((item) => pattern.test(item.name));
    if (pkg && !seen.has(pkg.id)) {
      seen.add(pkg.id);
      picked.push(pkg);
    }
  }

  if (picked.length) {
    return picked.sort(
      (a, b) => membershipRank(a.name) - membershipRank(b.name) || a.total_price - b.total_price
    );
  }

  const memberships = packages.filter((pkg) =>
    /membership|vip|subscription/i.test(`${pkg.name} ${pkg.category.name}`)
  );
  if (memberships.length) {
    return memberships.sort((a, b) => a.total_price - b.total_price);
  }

  return packages.slice(0, Math.min(3, packages.length));
}

export function basketHasAuth(basket: TebexBasket) {
  return Boolean(basket.username || basket.username_id);
}
