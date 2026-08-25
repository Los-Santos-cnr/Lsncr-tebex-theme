import { Crown, Gift, IdCard, Zap } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { OFFERINGS } from "@/lib/site";
import { Badge } from "@/components/ui/Badge";

const ICONS = {
  membership: Crown,
  queue: Zap,
  name: IdCard,
  gift: Gift,
} as const;

const ACCENT: Record<(typeof OFFERINGS)[number]["icon"], "cop" | "robber"> = {
  membership: "cop",
  queue: "cop",
  name: "robber",
  gift: "robber",
};

export function OfferingCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {OFFERINGS.map((offer) => {
        const Icon = ICONS[offer.icon];
        const accent = ACCENT[offer.icon];
        return (
          <div
            key={offer.title}
            className={cn(
              "lscnr-card group rounded-md p-5",
              accent === "cop" ? "lscnr-card--cop" : "lscnr-card--robber"
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-md border",
                  accent === "cop"
                    ? "border-cop/30 bg-cop/10"
                    : "border-robber/30 bg-robber/10"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", accent === "cop" ? "text-cop" : "text-robber")}
                />
              </div>
              {offer.wip ? <Badge tone="warning">WIP</Badge> : null}
            </div>
            <h3 className="font-display text-base font-bold uppercase tracking-wide text-foreground">
              {offer.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {offer.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
