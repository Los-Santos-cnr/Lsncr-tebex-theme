import { NextResponse } from "next/server";
import { adminError, guardAdmin } from "../_guard";
import { createCoupon, listCoupons, type CreateCouponInput } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  const page = Number(new URL(req.url).searchParams.get("page") ?? "1") || 1;
  try {
    const result = await listCoupons(page);
    return NextResponse.json(result);
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(req: Request) {
  const blocked = await guardAdmin();
  if (blocked) return blocked;

  let body: CreateCouponInput;
  try {
    body = (await req.json()) as CreateCouponInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.code?.trim()) {
    return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
  }

  try {
    const result = await createCoupon(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return adminError(error);
  }
}
