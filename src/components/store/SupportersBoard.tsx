import { Crown, Heart } from "lucide-react";
import { EmptyState } from "@/components/ui/Section";
import { cn } from "@/components/ui/cn";
import type { PublicSupporter } from "@/lib/supporters";

const PODIUM_STYLES = [
  {
    wrap: "border-gold/55 bg-gradient-to-b from-gold/18 to-surface sm:order-2 sm:pb-10 sm:-mt-4",
    rank: "text-gold",
    medal: "Gold",
  },
  {
    wrap: "border-[#c0c0c0]/35 bg-gradient-to-b from-white/10 to-surface sm:order-1",
    rank: "text-[#d8d8d8]",
    medal: "Silver",
  },
  {
    wrap: "border-[#cd7f32]/40 bg-gradient-to-b from-[#cd7f32]/15 to-surface sm:order-3",
    rank: "text-[#e0a36b]",
    medal: "Bronze",
  },
] as const;

export function SupportersBoard({ supporters }: { supporters: PublicSupporter[] }) {
  if (!supporters.length) {
    return (
      <EmptyState
        title="The hall of fame is warming up"
        description="As players support the server, their names will appear here. No amounts, just a thank you."
      />
    );
  }

  const podium = [supporters[0], supporters[1], supporters[2]].filter(Boolean);
  const rest = supporters.slice(podium.length);

  return (
    <div className="space-y-10">
      {podium.length ? (
        <ol className="grid gap-3 sm:grid-cols-3 sm:items-end">
          {podium.map((supporter, index) => {
            const style = PODIUM_STYLES[index] ?? PODIUM_STYLES[2];
            return (
              <li
                key={`${supporter.rank}-${supporter.id}`}
                className={cn(
                  "rounded-lg border px-5 py-6 text-center shadow-pop",
                  style.wrap,
                  index === 0 && "order-first"
                )}
              >
                <p className={cn("lscnr-eyebrow", style.rank)}>{style.medal}</p>
                {index === 0 ? (
                  <Crown className="mx-auto mt-3 h-7 w-7 text-gold" aria-hidden />
                ) : (
                  <span className={cn("mt-3 block font-display text-3xl font-semibold", style.rank)}>
                    {supporter.rank}
                  </span>
                )}
                <p
                  className={cn(
                    "lscnr-heading mt-3 text-xl text-foreground sm:text-2xl",
                    !supporter.name && "font-mono"
                  )}
                >
                  {supporter.name ?? supporter.id}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {index === 0 ? "Our most generous supporter" : `Rank ${supporter.rank}`}
                </p>
              </li>
            );
          })}
        </ol>
      ) : null}

      {rest.length ? (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-3.5 w-3.5 text-gold" aria-hidden />
            <p className="text-xs uppercase tracking-[0.18em]">And everyone who keeps LS running</p>
          </div>
          <ol className="grid gap-2 sm:grid-cols-2">
            {rest.map((supporter) => (
              <li
                key={`${supporter.rank}-${supporter.id}`}
                className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5"
              >
                <span className="w-10 shrink-0 font-display text-sm font-semibold text-gold">
                  {String(supporter.rank).padStart(3, "0")}
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate text-sm text-foreground",
                    !supporter.name && "font-mono"
                  )}
                >
                  {supporter.name ?? supporter.id}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
