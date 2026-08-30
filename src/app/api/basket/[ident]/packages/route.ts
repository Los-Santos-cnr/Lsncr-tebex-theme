import { NextRequest, NextResponse } from "next/server";
import {
  addCatalogPackageToBasket,
  isBasketAuthError,
  PackageOptionsNeededError,
  removePackageFromBasket,
} from "@/lib/tebex";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params;
    const body = (await request.json()) as {
      package_id?: number | string;
      quantity?: number;
      type?: string;
      variable_data?: Record<string, string>;
      discord_id?: string;
      giftcard_to?: string;
      email?: string;
    };

    if (!body.package_id) {
      return NextResponse.json({ error: "package_id is required" }, { status: 400 });
    }

    const variable_data: Record<string, string> = { ...(body.variable_data ?? {}) };
    const discordId = body.discord_id || request.cookies.get("lscnr-discord-id")?.value || "";
    if (discordId) variable_data.discord_id = discordId;
    if (body.giftcard_to) variable_data.giftcard_to = body.giftcard_to;

    const basket = await addCatalogPackageToBasket(
      ident,
      Number(body.package_id),
      body.quantity ?? 1,
      {
        type: body.type,
        variable_data,
        email: body.email,
      }
    );
    return NextResponse.json({ data: basket });
  } catch (error) {
    if (error instanceof PackageOptionsNeededError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          options: error.options,
          type: error.packageType,
        },
        { status: 422 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to add package";
    const authRequired = isBasketAuthError(message);
    return NextResponse.json(
      { error: message, code: authRequired ? "AUTH_REQUIRED" : "ADD_FAILED" },
      { status: authRequired ? 401 : 400 }
    );
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
