import { NextResponse } from "next/server";
import { adminError, guardAdmin } from "../../_guard";
import { updatePackage, type UpdatePackageInput } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  const { id } = await params;
  let body: UpdatePackageInput;
  try {
    body = (await req.json()) as UpdatePackageInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await updatePackage(id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error);
  }
}
