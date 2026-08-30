import { NextResponse } from "next/server";
import { FALLBACK_USD_RATES } from "@/lib/currency";

export async function GET() {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("FX lookup failed");

    const data = (await res.json()) as { rates?: Record<string, number> };
    return NextResponse.json({
      ...FALLBACK_USD_RATES,
      ...data.rates,
      USD: 1,
    });
  } catch {
    return NextResponse.json(FALLBACK_USD_RATES);
  }
}
