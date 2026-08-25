"use client";

import { useMemo, useState } from "react";
import { PackageCard } from "@/components/store/PackageCard";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/Section";
import type { TebexPackage } from "@/lib/tebex-types";
import { stripHtml } from "@/lib/format";

export function StoreCatalog({
  packages,
  categories,
}: {
  packages: TebexPackage[];
  categories: { id: number; name: string }[];
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [sort, setSort] = useState<"name" | "price-asc" | "price-desc">("name");

  const filtered = useMemo(() => {
    let result = [...packages];

    if (categoryId !== "all") {
      result = result.filter((p) => String(p.category.id) === categoryId);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          stripHtml(p.description).toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sort === "price-asc") return a.total_price - b.total_price;
      if (sort === "price-desc") return b.total_price - a.total_price;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [packages, categoryId, search, sort]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search packages…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-9 rounded-md border border-input bg-elevated px-3 text-sm focus-ring"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-9 rounded-md border border-input bg-elevated px-3 text-sm focus-ring"
        >
          <option value="name">Sort: Name</option>
          <option value="price-asc">Sort: Price low to high</option>
          <option value="price-desc">Sort: Price high to low</option>
        </select>
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} variant="grid" />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No packages found"
          description="Try a different search or category filter."
        />
      )}
    </div>
  );
}
