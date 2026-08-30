"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PackageCard } from "@/components/store/PackageCard";
import { SectionLabel } from "@/components/store/SectionLabel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { categoryHref } from "@/lib/tebex";
import type { TebexCategory, TebexPackage } from "@/lib/tebex-types";

export function HomePackagesSection({
  preview,
  categories,
  shopHref,
}: {
  preview: TebexPackage[];
  categories: TebexCategory[];
  shopHref: string | null;
}) {
  const [activeId, setActiveId] = useState<number | "all">("all");

  const selected = activeId === "all" ? null : categories.find((category) => category.id === activeId);
  const packages = useMemo(() => {
    if (!selected) return preview;
    return selected.packages ?? [];
  }, [preview, selected]);

  const viewAllHref = selected ? categoryHref(selected) : shopHref;

  return (
    <section id="packages" className="scroll-mt-24 space-y-5">
      <div className="flex items-end justify-between gap-3">
        <SectionLabel eyebrow="Store" title="Packages" />
        {viewAllHref ? (
          <Link href={viewAllHref}>
            <Button variant="outline" size="sm" className="font-display uppercase tracking-[0.16em]">
              View all
            </Button>
          </Link>
        ) : null}
      </div>
      {categories.length ? (
        <div className="flex flex-wrap gap-2">
          <Chip active={activeId === "all"} onClick={() => setActiveId("all")}>
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              active={activeId === category.id}
              onClick={() => setActiveId(category.id)}
            >
              {category.name}
            </Chip>
          ))}
        </div>
      ) : null}
      {packages.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No packages in this category yet.</p>
      )}
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 font-display text-[11px] uppercase tracking-[0.18em] transition-colors",
        active
          ? "border-gold bg-gold/10 text-gold"
          : "border-border text-muted-foreground hover:border-gold hover:text-gold"
      )}
    >
      {children}
    </button>
  );
}
