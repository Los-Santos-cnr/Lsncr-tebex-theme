import { NextResponse } from "next/server";
import { findAuthProvider, getBasketAuthUrls, normalizeAuthProviders } from "@/lib/tebex";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ident: string }> }
) {
  try {
    const { ident } = await params;
    const { searchParams } = new URL(request.url);
    const returnUrl = searchParams.get("returnUrl");
    const provider = searchParams.get("provider");

    if (!returnUrl) {
      return NextResponse.json({ error: "returnUrl is required" }, { status: 400 });
    }

    const providers = await getBasketAuthUrls(ident, returnUrl);

    if (provider) {
      const match = findAuthProvider(providers, provider);
      if (!match?.url) {
        return NextResponse.json(
          { error: "Auth provider not found", providers },
          { status: 404 }
        );
      }
      return NextResponse.json({ provider: match, providers });
    }

    return NextResponse.json({ providers: normalizeAuthProviders(providers) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get auth URLs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
