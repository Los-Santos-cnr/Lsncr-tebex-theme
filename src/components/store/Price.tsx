"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { formatPrice } from "@/lib/format";

export function Price({
  amount,
  from,
  className,
}: {
  amount: number;
  from: string;
  className?: string;
}) {
  const { convert, formatCurrency } = useCurrency();
  return (
    <span className={className}>{formatPrice(convert(amount, from), formatCurrency(from))}</span>
  );
}
