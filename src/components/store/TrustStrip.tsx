import { Headphones, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/components/ui/cn";
import { PACKAGE_TRUST } from "@/lib/site";

const TRUST_ICONS = {
  delivery: Zap,
  secure: ShieldCheck,
  support: Headphones,
} as const;

export function TrustStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-6 border-y border-border py-6 sm:grid-cols-3",
        className
      )}
    >
      {PACKAGE_TRUST.map((item) => {
        const Icon = TRUST_ICONS[item.icon];
        return (
          <div key={item.title} className="flex items-start gap-4">
            <Icon className="mt-0.5 h-5 w-5 text-gold" />
            <span>
              <span className="lscnr-heading block text-sm text-foreground">{item.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.subtitle}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
