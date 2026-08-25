import { NextResponse } from "next/server";
import { adminError, guardAdmin } from "../../_guard";
import { deleteCoupon } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  const { id } = await params;
  try {
    await deleteCoupon(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error);
  }
}
