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
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((category) => {
        const image = category.packages?.[0]?.image;
        const count = category.packages?.length ?? 0;
        return (
          <Link
            key={category.id}
            href={categoryHref(category)}
            className="lscnr-panel group relative overflow-hidden rounded-sm transition-colors hover:border-cop/35"
          >
            <div className="relative aspect-[4/3] bg-surface-2 p-4">
              {image ? (
                <Image
                  src={image}
                  alt={category.name}
                  fill
                  className="object-contain"
                  sizes="300px"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 border-t border-cop/20 bg-background/80 p-4 backdrop-blur-sm">
                <p className="lscnr-heading text-base text-foreground">{category.name}</p>
                <p className="mt-1 font-display text-[10px] font-semibold uppercase tracking-widest text-gold">
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
