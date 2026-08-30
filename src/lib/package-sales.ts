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
    return sale.discount.percentage || 0;
  }
  if (original <= 0) return 0;
  return Math.round((1 - next / original) * 100);
}

export function applySaleToPackage(
  pkg: TebexPackage,
  sales: TebexSale[],
  extraCategoryIds: number[] = []
): TebexPackage {
  if (pkg.sale?.active || (pkg.discount ?? 0) > 0) return pkg;

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
  if (!sales.length) return categories;
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
