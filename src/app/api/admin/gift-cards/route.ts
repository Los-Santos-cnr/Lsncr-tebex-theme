import { NextResponse } from "next/server";
import { adminError, guardAdmin } from "../_guard";
import { createGiftCard, listGiftCards, type CreateGiftCardInput } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const blocked = await guardAdmin();
  if (blocked) return blocked;
  try {
    const result = await listGiftCards();
    return NextResponse.json(result);
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(req: Request) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  let body: CreateGiftCardInput;
  try {
    body = (await req.json()) as CreateGiftCardInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.amount || body.amount <= 0) {
    return NextResponse.json({ error: "A positive amount is required" }, { status: 400 });
  }

  try {
    const result = await createGiftCard(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return adminError(error);
  }
}
