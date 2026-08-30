import { NextResponse } from "next/server";

export const DISCORD_ID_COOKIE = "lscnr-discord-id";
export const DISCORD_NAME_COOKIE = "lscnr-discord-name";
export const DISCORD_STATE_COOKIE = "lscnr-discord-state";
export const DISCORD_RETURN_COOKIE = "lscnr-discord-return";
export const DISCORD_CHECKOUT_COOKIE = "lscnr-discord-checkout";

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
  path: "/",
};

export function discordSessionCookieOptions() {
  return { ...COOKIE_BASE, maxAge: 60 * 60 * 24 * 30 };
}

export function discordStateCookieOptions() {
  return { ...COOKIE_BASE, maxAge: 60 * 10 };
}

export function getDiscordOAuthConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.DISCORD_CLIENT_SECRET?.trim() ?? "";
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

export function getDiscordRedirectUri(request: Request) {
  const configured = process.env.DISCORD_REDIRECT_URI?.trim();
  if (configured) return configured;
  return new URL("/api/discord/callback", request.url).toString();
}

export function safeReturnPath(value: string | null | undefined, fallback = "/cart") {
  if (!value) return fallback;
  try {
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    const url = new URL(value);
    const path = `${url.pathname}${url.search}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
  } catch {
    return fallback;
  }
}

export function discordAuthorizeUrl(clientId: string, redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

export async function exchangeDiscordCode(options: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}) {
  const body = new URLSearchParams({
    client_id: options.clientId,
    client_secret: options.clientSecret,
    grant_type: "authorization_code",
    code: options.code,
    redirect_uri: options.redirectUri,
  });

  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const tokenPayload = (await tokenRes.json().catch(() => null)) as {
    access_token?: string;
    error_description?: string;
    error?: string;
  } | null;
  if (!tokenRes.ok || !tokenPayload?.access_token) {
    throw new Error(tokenPayload?.error_description || tokenPayload?.error || "Discord login failed");
  }

  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
    cache: "no-store",
  });
  const user = (await userRes.json().catch(() => null)) as {
    id?: string;
    username?: string;
    global_name?: string | null;
  } | null;
  if (!userRes.ok || !user?.id) {
    throw new Error("Could not read the Discord profile");
  }

  return {
    id: user.id,
    username: user.global_name?.trim() || user.username || "Discord",
  };
}

export function applyDiscordSession(
  response: NextResponse,
  user: { id: string; username: string }
) {
  const options = discordSessionCookieOptions();
  response.cookies.set(DISCORD_ID_COOKIE, user.id, options);
  response.cookies.set(DISCORD_NAME_COOKIE, user.username, options);
  return response;
}

export function clearDiscordSession(response: NextResponse) {
  const clear = { ...COOKIE_BASE, maxAge: 0 };
  response.cookies.set(DISCORD_ID_COOKIE, "", clear);
  response.cookies.set(DISCORD_NAME_COOKIE, "", clear);
  response.cookies.set(DISCORD_STATE_COOKIE, "", clear);
  response.cookies.set(DISCORD_RETURN_COOKIE, "", clear);
  response.cookies.set(DISCORD_CHECKOUT_COOKIE, "", clear);
  return response;
}
