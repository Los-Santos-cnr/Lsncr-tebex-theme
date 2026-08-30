import { MapPin } from "lucide-react";
import { HERO_BADGE_TEXT } from "@/lib/site";
import { cn } from "@/components/ui/cn";

export function GlassBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border border-gold/30 bg-black/50 px-4 py-3 text-sm text-foreground backdrop-blur-sm",
        className
      )}
    >
      <MapPin className="h-4 w-4 shrink-0 text-cop" />
      <span className="text-xs font-medium">
        {HERO_BADGE_TEXT}
      </span>
    </div>
  );
}
