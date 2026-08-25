import { NextResponse } from "next/server";
import { adminError, guardAdmin } from "../../_guard";
import { topUpGiftCard, voidGiftCard } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  const { id } = await params;
  try {
    const result = await voidGiftCard(id);
    return NextResponse.json(result);
  } catch (error) {
    return adminError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  const { id } = await params;
  let amount = 0;
  try {
    const body = (await req.json()) as { amount?: number };
    amount = Number(body.amount ?? 0);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "A positive amount is required" }, { status: 400 });
  }

  try {
    const result = await topUpGiftCard(id, amount);
    return NextResponse.json(result);
  } catch (error) {
    return adminError(error);
  }
}
