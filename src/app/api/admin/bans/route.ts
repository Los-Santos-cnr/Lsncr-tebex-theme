import { NextResponse } from "next/server";
import { adminError, guardAdmin } from "../_guard";
import { createBan, listBans, type CreateBanInput } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const blocked = await guardAdmin();
  if (blocked) return blocked;
  try {
    const result = await listBans();
    return NextResponse.json(result);
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(req: Request) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  let body: CreateBanInput;
  try {
    body = (await req.json()) as CreateBanInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.user?.trim()) {
    return NextResponse.json({ error: "A username or UUID is required" }, { status: 400 });
  }
  if (!body.reason?.trim()) {
    return NextResponse.json({ error: "A ban reason is required" }, { status: 400 });
  }

  try {
    const result = await createBan(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return adminError(error);
  }
}
