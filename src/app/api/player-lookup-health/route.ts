import { NextResponse } from "next/server";
import {
  getPlayerLookupUrl,
  isPlayerLookupConfigured,
  lookupPlayerNames,
} from "@/lib/player-lookup";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isPlayerLookupConfigured();
  let ucp = false;
  try {
    const res = await fetch(`${getPlayerLookupUrl()}/api/players/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    ucp = res.ok;
  } catch {
    ucp = false;
  }

  let sample: string | null = null;
  if (configured) {
    const names = await lookupPlayerNames([1086733]);
    sample = names.get(1086733) ?? null;
  }

  return NextResponse.json({ configured, ucp, sample });
}
