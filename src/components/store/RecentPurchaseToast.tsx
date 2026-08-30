"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/components/ui/cn";
import { formatTimeAgo, type RecentPurchase } from "@/lib/recent-purchases";

const SHOW_MS = 4800;
const HIDE_MS = 700;
const GAP_MS = 1600;

export function RecentPurchaseToast() {
  const [items, setItems] = useState<RecentPurchase[]>([]);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch("/api/recent-purchases")
        .then((res) => (res.ok ? res.json() : null))
        .then((payload: { data?: RecentPurchase[] } | null) => {
          if (cancelled || !payload?.data?.length) return;
          setItems(payload.data);
        })
        .catch(() => undefined);
    };

    load();
    const refresh = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, []);

  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    let timer: number;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = window.setTimeout(resolve, ms);
      });

    const run = async () => {
      while (!cancelled) {
        setOpen(true);
        await wait(SHOW_MS);
        if (cancelled) return;
        setOpen(false);
        await wait(HIDE_MS);
        if (cancelled) return;
        setIndex((current) => (current + 1) % items.length);
        await wait(GAP_MS);
      }
    };

    run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [items]);

  if (!items.length) return null;

  const purchase = items[index % items.length];
  if (!purchase) return null;

  return (
    <aside
      aria-live="polite"
      className={cn(
        "purchase-toast pointer-events-none fixed bottom-4 right-4 z-40 w-[min(calc(100%-1.5rem),28rem)]",
        open && "purchase-toast--in"
      )}
    >
      <div className="pointer-events-auto flex items-start gap-3 rounded-lg border border-gold/25 bg-black/85 px-3 py-2.5 shadow-pop chrome-blur">
        <span className="relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gold/15 text-gold">
          {purchase.avatar ? (
            <img
              src={purchase.avatar}
              alt=""
              className="h-full w-full scale-125 object-cover blur-[5px]"
            />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-sm leading-snug text-foreground">
            <strong className="font-semibold">Someone</strong> purchased{" "}
            {purchase.href ? (
              <Link
                href={purchase.href}
                className="text-gold underline-offset-2 hover:underline"
              >
                {purchase.item}
              </Link>
            ) : (
              <span className="text-gold">{purchase.item}</span>
            )}
          </span>
          <span className="mt-0.5 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            {formatTimeAgo(purchase.at)}
          </span>
        </span>
      </div>
    </aside>
  );
}
