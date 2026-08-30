import { NextResponse } from "next/server";
import {
  fivemIdFromTebexPlayer,
  getPlayerLookupUrl,
  isPlayerLookupConfigured,
  lookupPlayerNames,
} from "@/lib/player-lookup";
import { isAdminApiConfigured, listPayments } from "@/lib/tebex-admin";

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

  let tebexPlayer: {
    name: string | null;
    pluginId: string | number | null;
    uuid: string | null;
    fivemIdWeSendToUcp: number | null;
  } | null = null;

  if (isAdminApiConfigured()) {
    try {
      const payments = await listPayments(25, { revalidate: false });
      const payment =
        payments.find((item) => item.player?.name?.toLowerCase() === "maty17") ??
        payments.find((item) => (item.status ?? "complete").toLowerCase() === "complete") ??
        payments[0];
      const player = payment?.player;
      if (player) {
        tebexPlayer = {
          name: player.name ?? null,
          pluginId: player.id ?? null,
          uuid: player.uuid ?? null,
          fivemIdWeSendToUcp: fivemIdFromTebexPlayer(player),
        };
      }
    } catch (error) {
      console.error("player lookup health tebex:", error);
    }
  }

  return NextResponse.json({ configured, ucp, sample, tebexPlayer });
}
