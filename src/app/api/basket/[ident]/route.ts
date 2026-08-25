import { NextResponse } from "next/server";
import { getBasket } from "@/lib/tebex";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params;
    const basket = await getBasket(ident);
    return NextResponse.json({ data: basket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch basket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
