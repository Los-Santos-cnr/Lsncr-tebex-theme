"use client";

import { ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/components/ui/cn";
import { TRUST_STATS } from "@/lib/site";

export function SocialProofBar({ className }: { className?: string }) {
  const [discordCount, setDiscordCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/discord/members")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { count?: number } | null) => {
        if (data?.count != null) setDiscordCount(data.count);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-2.5", className)}>
      {TRUST_STATS.map((stat) => (
        <span
          key={stat.label}
          className="hero-proof-pill inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-cop" />
          {stat.label}
        </span>
      ))}
      {discordCount != null ? (
        <span className="hero-proof-pill inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium">
          <Users className="h-3.5 w-3.5 text-cop" />
          {discordCount.toLocaleString()} online now
        </span>
      ) : null}
    </div>
  );
}
