export const DISPLAY_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const CURRENCY_STORAGE_KEY = "lscnr-display-currency";

export const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.37,
  AUD: 1.53,
};

export function isDisplayCurrency(value: string | null | undefined): value is DisplayCurrency {
  return !!value && (DISPLAY_CURRENCIES as readonly string[]).includes(value);
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
) {
  const src = from.toUpperCase();
  const dst = to.toUpperCase();
  if (src === dst) return amount;
  const fromRate = rates[src];
  const toRate = rates[dst];
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
}

export function displayCurrencyFor(
  from: string,
  to: string,
  rates: Record<string, number>
) {
  const src = from.toUpperCase();
  const dst = to.toUpperCase();
  if (src === dst) return dst;
  if (!rates[src] || !rates[dst]) return src;
  return dst;
}
