import { Car, Crown, Shirt, Zap } from "lucide-react";
import { cn } from "@/components/ui/cn";

const FEATURES = [
  {
    icon: Zap,
    title: "Instant in-game",
    description: "Perks hit your character after purchase",
  },
  {
    icon: Crown,
    title: "VIP & priority",
    description: "Queue skips, slots, and member perks",
  },
  {
    icon: Car,
    title: "Rides & whips",
    description: "Exclusive vehicles for your storyline",
  },
  {
    icon: Shirt,
    title: "Fits & gear",
    description: "Clothing and items for your character",
  },
] as const;

export function FeatureGrid({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:gap-3", className)}>
      {FEATURES.map((feature) => (
        <div key={feature.title} className="lscnr-panel rounded-sm p-3 sm:p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-sm bg-gold/10">
            <feature.icon className="h-4 w-4 text-gold" />
          </div>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
            {feature.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}
