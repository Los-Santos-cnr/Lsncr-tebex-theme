import { NextResponse } from "next/server";
import {
  DISCORD_CHECKOUT_COOKIE,
  DISCORD_RETURN_COOKIE,
  DISCORD_STATE_COOKIE,
  discordAuthorizeUrl,
  discordStateCookieOptions,
  getDiscordOAuthConfig,
  getDiscordRedirectUri,
  safeReturnPath,
} from "@/lib/discord-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { clientId, configured } = getDiscordOAuthConfig();
  const returnPath = safeReturnPath(url.searchParams.get("returnUrl"));
  const checkout = url.searchParams.get("checkout") === "1";

  if (!configured) {
    const back = new URL(returnPath, url.origin);
    back.searchParams.set("discord_error", "not_configured");
    return NextResponse.redirect(back);
  }

  const state = crypto.randomUUID();
  const authorize = discordAuthorizeUrl(clientId, getDiscordRedirectUri(request), state);
  const response = NextResponse.redirect(authorize);
  const options = discordStateCookieOptions();
  response.cookies.set(DISCORD_STATE_COOKIE, state, options);
  response.cookies.set(DISCORD_RETURN_COOKIE, returnPath, options);
  response.cookies.set(DISCORD_CHECKOUT_COOKIE, checkout ? "1" : "", options);
  return response;
}
