import { NextRequest, NextResponse } from "next/server";
import {
  DISCORD_ID_COOKIE,
  DISCORD_NAME_COOKIE,
  clearDiscordSession,
} from "@/lib/discord-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = request.cookies.get(DISCORD_ID_COOKIE)?.value ?? "";
  const username = request.cookies.get(DISCORD_NAME_COOKIE)?.value ?? "";
  if (!id) {
    return NextResponse.json({ id: null, username: null });
  }
  return NextResponse.json({ id, username });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  return clearDiscordSession(response);
}
