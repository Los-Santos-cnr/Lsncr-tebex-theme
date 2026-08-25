import { NextResponse } from "next/server";
import { addPackageToBasket, removePackageFromBasket } from "@/lib/tebex";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params;
    const body = (await request.json()) as {
      package_id?: number | string;
      quantity?: number;
    };

    if (!body.package_id) {
      return NextResponse.json({ error: "package_id is required" }, { status: 400 });
    }

    const basket = await addPackageToBasket(
      ident,
      Number(body.package_id),
      body.quantity ?? 1
    );
    return NextResponse.json({ data: basket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add package";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params;
    const body = (await request.json()) as { package_id?: number | string };

    if (!body.package_id) {
      return NextResponse.json({ error: "package_id is required" }, { status: 400 });
    }

    const basket = await removePackageFromBasket(ident, Number(body.package_id));
    return NextResponse.json({ data: basket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove package";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
