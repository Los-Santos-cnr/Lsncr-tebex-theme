"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DISPLAY_CURRENCIES,
  useCurrency,
  type DisplayCurrency,
} from "@/components/providers/CurrencyProvider";
import { cn } from "@/components/ui/cn";

export function CurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function choose(next: DisplayCurrency) {
    setCurrency(next);
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <button
        type="button"
        aria-label="Display currency"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 w-full items-center justify-between gap-2 rounded-sm border border-gold bg-black px-2.5 font-display text-xs font-semibold uppercase tracking-[0.16em] text-foreground focus-ring"
      >
        {currency}
        <ChevronDown className={cn("h-3.5 w-3.5 text-gold transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Currencies"
          className="absolute right-0 z-50 mt-1 min-w-full overflow-hidden rounded-sm border border-gold bg-black py-1 shadow-pop"
        >
          {DISPLAY_CURRENCIES.map((code) => (
            <li key={code} role="option" aria-selected={code === currency}>
              <button
                type="button"
                onClick={() => choose(code)}
                className={cn(
                  "flex w-full px-3 py-1.5 text-left font-display text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                  code === currency
                    ? "bg-gold/20 text-gold"
                    : "text-foreground hover:bg-gold/10 hover:text-gold"
                )}
              >
                {code}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
