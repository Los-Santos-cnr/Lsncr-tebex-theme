"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/components/ui/cn";

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function PromoCountdown({ className }: { className?: string }) {
  const endsAt = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_SALE_ENDS_AT?.trim();
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }, []);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!endsAt || Number.isNaN(endsAt.getTime())) return;

    const tick = () => {
      const diff = endsAt.getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (!endsAt || remaining === null || remaining <= 0) return null;

  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Offer ends in{" "}
      <span className="font-display font-bold text-gold">{formatRemaining(remaining)}</span>
    </p>
  );
}
