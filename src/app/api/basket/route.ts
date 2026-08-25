import { NextResponse } from "next/server";
import { createBasket } from "@/lib/tebex";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const basket = await createBasket();
    return NextResponse.json({ data: basket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create basket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
