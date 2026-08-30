"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatPrice } from "@/lib/format";

export function Price({
  amount,
  from,
  original,
  className,
}: {
  amount: number;
  from: string;
  original?: number | null;
  className?: string;
}) {
  const { convert, formatCurrency } = useCurrency();
  const currency = formatCurrency(from);
  const current = formatPrice(convert(amount, from), currency);
  const was =
    original != null && original > amount + 0.001
      ? formatPrice(convert(original, from), currency)
      : null;

  if (!was) {
    return <span className={className}>{current}</span>;
  }

  return (
    <span className={className}>
      <span className="mr-1.5 font-normal text-muted-foreground line-through decoration-muted-foreground/80">
        {was}
      </span>
      <span>{current}</span>
    </span>
  );
}
