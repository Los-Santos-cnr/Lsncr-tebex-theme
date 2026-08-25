import { NextResponse } from "next/server";
import { applyCoupon, removeCoupon } from "@/lib/tebex";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params;
    const body = (await request.json()) as { coupon_code?: string };

    if (!body.coupon_code?.trim()) {
      return NextResponse.json({ error: "coupon_code is required" }, { status: 400 });
    }

    const basket = await applyCoupon(ident, body.coupon_code.trim());
    return NextResponse.json({ data: basket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params;
    const body = (await request.json()) as { coupon_code?: string };

    if (!body.coupon_code?.trim()) {
      return NextResponse.json({ error: "coupon_code is required" }, { status: 400 });
    }

    const basket = await removeCoupon(ident, body.coupon_code.trim());
    return NextResponse.json({ data: basket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove coupon";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
