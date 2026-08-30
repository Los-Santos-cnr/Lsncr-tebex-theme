"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCY_STORAGE_KEY,
  DISPLAY_CURRENCIES,
  FALLBACK_USD_RATES,
  convertAmount,
  displayCurrencyFor,
  isDisplayCurrency,
  type DisplayCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
  convert: (amount: number, from: string) => number;
  formatCurrency: (from: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("USD");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_USD_RATES);

  useEffect(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (isDisplayCurrency(stored)) setCurrencyState(stored);

    fetch("/api/currency-rates")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Record<string, number> | null) => {
        if (!data || typeof data !== "object") return;
        setRates({ ...FALLBACK_USD_RATES, ...data, USD: 1 });
      })
      .catch(() => undefined);
  }, []);

  const setCurrency = useCallback((next: DisplayCurrency) => {
    setCurrencyState(next);
    localStorage.setItem(CURRENCY_STORAGE_KEY, next);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      convert: (amount, from) => convertAmount(amount, from, currency, rates),
      formatCurrency: (from) => displayCurrencyFor(from, currency, rates),
    }),
    [currency, rates, setCurrency]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}

export { DISPLAY_CURRENCIES };
export type { DisplayCurrency };
