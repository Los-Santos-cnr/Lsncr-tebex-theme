import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "rr_admin_session";
const SESSION_MESSAGE = "lscnr-admin-session-v1";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

/** Admin panel is only enabled when a password is configured. */
export function isAdminConfigured() {
  return getAdminPassword().length > 0;
}

/** Deterministic session token derived from the admin password. */
export function expectedSessionToken() {
  const password = getAdminPassword();
  if (!password) return "";
  return createHmac("sha256", password).update(SESSION_MESSAGE).digest("hex");
}

function safeEqual(a: string, b: string) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Verify a submitted password against the configured one. */
export function verifyPassword(candidate: string) {
  const password = getAdminPassword();
  if (!password) return false;
  return safeEqual(candidate, password);
}

/** Verify a session token value (from the cookie). */
export function verifySessionToken(token: string | undefined | null) {
  if (!token) return false;
  return safeEqual(token, expectedSessionToken());
}

/** Read the current request's cookie and confirm the admin session. */
export async function isAdminAuthenticated() {
  if (!isAdminConfigured()) return false;
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
