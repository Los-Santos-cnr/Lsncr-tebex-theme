import { Crown, Gift } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { OFFERINGS } from "@/lib/site";

const ICONS = {
  membership: Crown,
  queue: Crown,
  name: Gift,
  gift: Gift,
} as const;

export function OfferingCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {OFFERINGS.filter((offer) => !offer.wip).map((offer) => {
        const Icon = ICONS[offer.icon];
        return (
          <div key={offer.title} className="lscnr-card rounded-lg p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-2">
              <Icon className="h-5 w-5 text-cop" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{offer.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {offer.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
