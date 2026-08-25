"use client";

import { useEffect, useState } from "react";
import { cn } from "@/components/ui/cn";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
export type DisplayCurrency = (typeof CURRENCIES)[number];

const STORAGE_KEY = "lscnr-display-currency";

function readStoredCurrency(): DisplayCurrency {
  if (typeof window === "undefined") return "USD";
  const stored = localStorage.getItem(STORAGE_KEY) as DisplayCurrency | null;
  return stored && CURRENCIES.includes(stored) ? stored : "USD";
}

export function CurrencySelector({ className }: { className?: string }) {
  const [currency, setCurrency] = useState<DisplayCurrency>(readStoredCurrency);

  function handleChange(value: string) {
    const next = value as DisplayCurrency;
    setCurrency(next);
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("currency-change", { detail: next }));
  }

  return (
    <select
      aria-label="Display currency"
      value={currency}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(
        "h-8 rounded-md border border-border bg-elevated px-2 text-xs text-foreground focus-ring",
        className
      )}
    >
      {CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}

export function useDisplayCurrency() {
  const [currency, setCurrency] = useState<DisplayCurrency>(readStoredCurrency);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DisplayCurrency>).detail;
      if (detail) setCurrency(detail);
    };

    window.addEventListener("currency-change", handler);
    return () => window.removeEventListener("currency-change", handler);
  }, []);

  return currency;
}
