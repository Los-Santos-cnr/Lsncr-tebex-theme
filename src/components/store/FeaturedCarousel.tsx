"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import type { TebexPackage } from "@/lib/tebex-types";
import { PackageCard } from "./PackageCard";

export function FeaturedCarousel({
  packages,
  className,
}: {
  packages: TebexPackage[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(1);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1280) setPerView(3);
      else if (window.innerWidth >= 768) setPerView(2);
      else setPerView(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, packages.length - perView);
  const safeIndex = Math.min(index, maxIndex);

  const goTo = useCallback(
    (next: number) => {
      setIndex(Math.min(Math.max(0, next), maxIndex));
    },
    [maxIndex]
  );

  if (!packages.length) return null;

  const pages = maxIndex + 1;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{
              transform: `translateX(-${safeIndex * (100 / perView)}%)`,
            }}
          >
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="w-full shrink-0 px-2"
                style={{ width: `${100 / perView}%` }}
              >
                <PackageCard pkg={pkg} variant="carousel" />
              </div>
            ))}
          </div>
        </div>

        {packages.length > perView ? (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-sm border-border-strong"
              onClick={() => goTo(safeIndex - 1)}
              disabled={safeIndex === 0}
              aria-label="Previous packages"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-sm border-border-strong"
              onClick={() => goTo(safeIndex + 1)}
              disabled={safeIndex >= maxIndex}
              aria-label="Next packages"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>

      {pages > 1 ? (
        <div className="flex justify-center gap-2" role="tablist" aria-label="Carousel pages">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                i === safeIndex ? "bg-gold" : "bg-border hover:bg-border-strong"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
