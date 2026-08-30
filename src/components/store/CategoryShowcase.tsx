import Image from "next/image";
import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { categoryHref } from "@/lib/tebex";
import type { TebexCategory } from "@/lib/tebex-types";

export function CategoryShowcase({
  categories,
  className,
}: {
  categories: TebexCategory[];
  className?: string;
}) {
  const items = categories.slice(0, 4);
  if (!items.length) return null;

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((category) => {
        const image = category.packages?.[0]?.image;
        const count = category.packages?.length ?? 0;
        return (
          <Link
            key={category.id}
            href={categoryHref(category)}
            className="lscnr-panel group relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:border-gold/50"
          >
            <div className="relative aspect-[16/10] bg-surface-2">
              {image ? (
                <Image
                  src={image}
                  alt={category.name}
                  fill
                  className="object-contain p-5"
                  sizes="300px"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="lscnr-heading text-sm text-foreground">{category.name}</p>
                <p className="mt-0.5 font-display text-[10px] uppercase tracking-[0.18em] text-gold">
                  {count} {count === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
