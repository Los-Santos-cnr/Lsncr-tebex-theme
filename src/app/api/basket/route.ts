import { NextRequest, NextResponse } from "next/server";
import { DISCORD_ID_COOKIE } from "@/lib/discord-oauth";
import { createBasket } from "@/lib/tebex";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const discordId = request.cookies.get(DISCORD_ID_COOKIE)?.value ?? null;
    const basket = await createBasket({ discordId });
    return NextResponse.json({ data: basket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create basket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
