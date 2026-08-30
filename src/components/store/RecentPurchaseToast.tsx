"use client";

import { Crown, Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/components/ui/cn";
import { formatTimeAgo, purchaseVerb, type RecentPurchase } from "@/lib/recent-purchases";

const SHOW_MS = 7200;
const HIDE_MS = 400;
const GAP_MS = 350;

function RankMark({ rank }: { rank?: number | null }) {
  if (rank == null || rank < 1) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-gold">
        <Heart className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">Supporter</span>
      </span>
    );
  }

  const podium =
    rank === 1
      ? "border-gold/55 bg-gold/15 text-gold"
      : rank === 2
        ? "border-[#c0c0c0]/40 bg-white/10 text-[#d8d8d8]"
        : rank === 3
          ? "border-[#cd7f32]/45 bg-[#cd7f32]/15 text-[#e0a36b]"
          : "border-gold/30 bg-gold/10 text-gold";

  return (
    <span className={cn("flex size-10 shrink-0 flex-col items-center justify-center rounded-md border", podium)}>
      {rank === 1 ? (
        <Crown className="mb-0.5 h-3 w-3" aria-hidden />
      ) : (
        <span className="text-[8px] font-semibold uppercase leading-none tracking-[0.12em] opacity-70">Top</span>
      )}
      <span className="font-display text-[13px] font-semibold leading-none tabular-nums">
        {String(rank).padStart(3, "0")}
      </span>
      <span className="sr-only">Top supporter rank {rank}</span>
    </span>
  );
}

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
          setItems((current) => {
            const next = payload.data ?? [];
            const same =
              current.length === next.length &&
              current.every(
                (row, index) =>
                  row.id === next[index]?.id &&
                  row.rank === next[index]?.rank &&
                  row.action === next[index]?.action &&
                  row.quantity === next[index]?.quantity
              );
            return same ? current : next;
          });
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

  const quantity = purchase.quantity && purchase.quantity > 1 ? purchase.quantity : null;
  const verb = purchaseVerb(purchase.action);
  const itemName = (
    <>
      {purchase.href ? (
        <Link href={purchase.href} className="text-gold underline-offset-2 hover:underline">
          {purchase.item}
        </Link>
      ) : (
        <span className="text-gold">{purchase.item}</span>
      )}
      {quantity ? <span className="text-gold"> ×{quantity}</span> : null}
    </>
  );

  return (
    <aside
      aria-live="polite"
      className={cn(
        "purchase-toast pointer-events-none fixed bottom-6 right-4 z-40 max-w-[calc(100%-2rem)]",
        open && "purchase-toast--in"
      )}
    >
      <div className="pointer-events-auto flex w-max max-w-full items-center gap-2.5 rounded-lg border border-gold/35 bg-black/92 py-2 pl-2 pr-3.5 shadow-pop chrome-blur">
        <RankMark rank={purchase.rank} />
        <div>
          <p className="text-[13px] leading-5 text-foreground">
            <strong className="font-semibold">{purchase.buyer}</strong> {verb} {itemName}
          </p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {formatTimeAgo(purchase.at)}
          </p>
        </div>
      </div>
    </aside>
  );
}
