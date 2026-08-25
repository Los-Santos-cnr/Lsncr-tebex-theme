import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isAdminApiConfigured, TebexAdminError } from "@/lib/tebex-admin";

/** Returns a NextResponse to short-circuit with, or null if the request may proceed. */
export async function guardAdmin(): Promise<NextResponse | null> {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminApiConfigured()) {
    return NextResponse.json(
      { error: "TEBEX_SECRET_KEY is not configured on the server." },
      { status: 500 }
    );
  }
  return null;
}

/** Maps thrown Tebex/plugin errors to a JSON response. */
export function adminError(error: unknown): NextResponse {
  if (error instanceof TebexAdminError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}
