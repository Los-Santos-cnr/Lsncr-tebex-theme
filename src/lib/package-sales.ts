import type { TebexCategory, TebexPackage } from "./tebex-types";
import type { TebexSale } from "./tebex-admin";

function money(amount: number) {
  return Math.round(amount * 100) / 100;
}

function saleType(sale: TebexSale) {
  return (sale.effective?.type ?? "all").toLowerCase();
}

function discountType(sale: TebexSale) {
  return (sale.discount?.type ?? "").toLowerCase();
}

export function saleAppliesToPackage(
  sale: TebexSale,
  pkg: TebexPackage,
  extraCategoryIds: number[] = []
) {
  const type = saleType(sale);
  if (type === "package") {
    return (sale.effective.packages ?? []).includes(pkg.id);
  }
  if (type === "category") {
    const ids = sale.effective.categories ?? [];
    if (ids.includes(pkg.category?.id)) return true;
    return extraCategoryIds.some((id) => ids.includes(id));
  }
  return type === "all" || type === "cart" || type === "store" || !type;
}

export function discountedAmount(amount: number, sale: TebexSale) {
  const kind = discountType(sale);
  if (kind === "percentage") {
    return money(amount * (1 - (sale.discount.percentage || 0) / 100));
  }
  if (kind === "value" || kind === "amount") {
    return money(Math.max(0, amount - (sale.discount.value || 0)));
  }
  return amount;
}

function savings(pkg: TebexPackage, sale: TebexSale) {
  return pkg.total_price - discountedAmount(pkg.total_price, sale);
}

function discountPercent(sale: TebexSale, original: number, next: number) {
  if (discountType(sale) === "percentage") {
    return Math.round(sale.discount.percentage || 0);
  }
  if (original <= 0) return 0;
  return Math.round((1 - next / original) * 100);
}

function roundPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, Math.round(value));
}

/**
 * Headless `discount` is the pre-tax amount saved, not a percent.
 * 20% off €24.99 arrives as 4.998000000000001.
 */
function percentFromSavings(pkg: TebexPackage) {
  const saved = pkg.discount ?? 0;
  const base = pkg.base_price || 0;
  if (!(saved > 0) || !(base > 0)) return 0;
  return roundPercent((saved / (base + saved)) * 100);
}

function preSaleTotal(pkg: TebexPackage) {
  const saved = pkg.discount ?? 0;
  const base = pkg.base_price || 0;
  if (!(saved > 0)) return pkg.total_price;
  if (base > 0) return money((pkg.total_price * (base + saved)) / base);
  return money(pkg.total_price + saved);
}

export function packageSalePercent(
  pkg: Pick<TebexPackage, "base_price" | "total_price" | "discount" | "original_price" | "sale">
) {
  if (pkg.sale?.active && (pkg.sale.discount ?? 0) > 0) {
    return roundPercent(pkg.sale.discount);
  }
  const fromSavings = percentFromSavings(pkg as TebexPackage);
  if (fromSavings > 0) return fromSavings;
  const original = pkg.original_price;
  if (original != null && original > pkg.total_price + 0.001) {
    return roundPercent((1 - pkg.total_price / original) * 100);
  }
  return 0;
}

export function applySaleToPackage(
  pkg: TebexPackage,
  sales: TebexSale[],
  extraCategoryIds: number[] = []
): TebexPackage {
  if (pkg.sale?.active) return pkg;

  // Tebex already reduced the price. `discount` is the currency saved.
  if ((pkg.discount ?? 0) > 0) {
    const percent = percentFromSavings(pkg);
    if (!percent) return pkg;
    return {
      ...pkg,
      original_price:
        pkg.original_price != null && pkg.original_price > pkg.total_price
          ? pkg.original_price
          : preSaleTotal(pkg),
      discount: percent,
      sale: { active: true, discount: percent },
    };
  }

  const applicable = sales.filter((sale) =>
    saleAppliesToPackage(sale, pkg, extraCategoryIds)
  );
  if (!applicable.length) return pkg;

  const best = applicable.reduce((winner, sale) =>
    savings(pkg, sale) > savings(pkg, winner) ? sale : winner
  );

  const originalTotal = pkg.total_price;
  const nextTotal = discountedAmount(originalTotal, best);
  if (!(nextTotal < originalTotal - 0.001)) return pkg;

  const percent = discountPercent(best, originalTotal, nextTotal);

  return {
    ...pkg,
    original_price: originalTotal,
    base_price: discountedAmount(pkg.base_price, best),
    total_price: nextTotal,
    discount: percent,
    sale: { active: true, discount: percent },
  };
}

export function applySalesToCategories(
  categories: TebexCategory[],
  sales: TebexSale[]
): TebexCategory[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const ancestorIds = (categoryId?: number) => {
    const ids: number[] = [];
    let current = categoryId ? byId.get(categoryId) : undefined;
    while (current?.parent?.id) {
      ids.push(current.parent.id);
      current = byId.get(current.parent.id);
    }
    return ids;
  };

  return categories.map((category) => ({
    ...category,
    packages: (category.packages ?? []).map((pkg) =>
      applySaleToPackage(pkg, sales, ancestorIds(pkg.category?.id ?? category.id))
    ),
  }));
}
