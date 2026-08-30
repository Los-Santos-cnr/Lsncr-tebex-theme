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

function roundShare(score: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(score * factor) / factor;
}

function shareLabel(score: number, decimals: number) {
  if (score <= 0) return (0).toFixed(decimals);
  const rounded = roundShare(score, decimals);
  if (rounded === 0) return `<${(1 / 10 ** decimals).toFixed(decimals)}`;
  return rounded.toFixed(decimals);
}

/** Use extra decimals when rounding would make two different totals look tied. */
function formatShares(scores: number[]) {
  let decimals = 2;
  while (decimals < 4) {
    const labels = scores.map((score) => shareLabel(score, decimals));
    const tied = scores.some((score, index) =>
      scores.some((other, otherIndex) => index !== otherIndex && score !== other && labels[index] === labels[otherIndex])
    );
    if (!tied) break;
    decimals += 1;
  }
  return scores.map((score) => shareLabel(score, decimals));
}

function ScoreMark({
  label,
  score,
  maxScore,
  className,
}: {
  label: string;
  score: number;
  maxScore: number;
  className?: string;
}) {
  const bar = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;
  return (
    <span className={cn("flex w-[3.25rem] shrink-0 flex-col justify-center gap-1", className)}>
      <span className="font-display text-[11px] font-semibold tabular-nums leading-none tracking-wide text-gold">
        {label}%
      </span>
      <span className="block h-1 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
        <span className="block h-full rounded-full bg-gold" style={{ width: `${bar}%` }} />
      </span>
      <span className="sr-only">{label} percent of all support on this board</span>
    </span>
  );
}

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
  const maxScore = supporters[0]?.score || 1;
  const labels = formatShares(supporters.map((supporter) => supporter.score));

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
                <div className="mx-auto mt-3 w-20">
                  <ScoreMark
                    label={labels[index] ?? shareLabel(supporter.score, 2)}
                    score={supporter.score}
                    maxScore={maxScore}
                    className="items-center"
                  />
                </div>
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
                <ScoreMark
                  label={labels[supporter.rank - 1] ?? shareLabel(supporter.score, 2)}
                  score={supporter.score}
                  maxScore={maxScore}
                />
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
