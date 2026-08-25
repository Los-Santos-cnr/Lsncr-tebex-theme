import { MapPin } from "lucide-react";
import { HERO_BADGE_TEXT } from "@/lib/site";
import { cn } from "@/components/ui/cn";

export function GlassBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border border-border bg-surface/90 px-4 py-3 text-sm text-foreground backdrop-blur-sm dark:border-cop/25 dark:bg-black/50",
        className
      )}
    >
      <MapPin className="h-4 w-4 shrink-0 text-gold" />
      <span className="font-display text-xs font-semibold uppercase tracking-wide">
        {HERO_BADGE_TEXT}
      </span>
    </div>
  );
}
