import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  expectedSessionToken,
  isAdminConfigured,
  verifyPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin panel is disabled. Set ADMIN_PASSWORD to enable it." },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = (await req.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!verifyPassword(password)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, expectedSessionToken(), adminCookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return res;
}
