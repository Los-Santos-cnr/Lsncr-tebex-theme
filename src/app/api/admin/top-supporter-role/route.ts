import { NextResponse } from "next/server";
import { adminError, guardAdmin } from "../_guard";
import { syncTopSupporterRoles } from "@/lib/top-supporter-role";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  let apply = true;
  try {
    const body = (await request.json().catch(() => ({}))) as { apply?: boolean };
    if (body.apply === false) apply = false;
  } catch {
    apply = true;
  }

  try {
    const result = await syncTopSupporterRoles({ apply });
    return NextResponse.json(result);
  } catch (error) {
    return adminError(error);
  }
}
