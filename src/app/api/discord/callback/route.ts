import { NextRequest, NextResponse } from "next/server";
import {
  DISCORD_CHECKOUT_COOKIE,
  DISCORD_RETURN_COOKIE,
  DISCORD_STATE_COOKIE,
  applyDiscordSession,
  discordStateCookieOptions,
  exchangeDiscordCode,
  getDiscordOAuthConfig,
  getDiscordRedirectUri,
  safeReturnPath,
} from "@/lib/discord-oauth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const expectedState = request.cookies.get(DISCORD_STATE_COOKIE)?.value;
  const returnPath = safeReturnPath(request.cookies.get(DISCORD_RETURN_COOKIE)?.value);
  const checkout = request.cookies.get(DISCORD_CHECKOUT_COOKIE)?.value === "1";
  const back = new URL(returnPath, origin);

  const fail = (code: string) => {
    back.searchParams.set("discord_error", code);
    const response = NextResponse.redirect(back);
    const clear = { ...discordStateCookieOptions(), maxAge: 0 };
    response.cookies.set(DISCORD_STATE_COOKIE, "", clear);
    return response;
  };

  if (request.nextUrl.searchParams.get("error")) {
    return fail(request.nextUrl.searchParams.get("error") || "denied");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("invalid_state");
  }

  const { clientId, clientSecret, configured } = getDiscordOAuthConfig();
  if (!configured) return fail("not_configured");

  try {
    const user = await exchangeDiscordCode({
      code,
      redirectUri: getDiscordRedirectUri(request),
      clientId,
      clientSecret,
    });
    back.searchParams.set("discord", "1");
    if (checkout) back.searchParams.set("checkout", "1");
    const response = NextResponse.redirect(back);
    applyDiscordSession(response, user);
    const clear = { ...discordStateCookieOptions(), maxAge: 0 };
    response.cookies.set(DISCORD_STATE_COOKIE, "", clear);
    response.cookies.set(DISCORD_RETURN_COOKIE, "", clear);
    response.cookies.set(DISCORD_CHECKOUT_COOKIE, "", clear);
    return response;
  } catch {
    return fail("token");
  }
}
