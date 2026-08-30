const DEFAULT_LOOKUP_URL = "https://ucp.lscnr.net";
const LOOKUP_LIMIT = 100;
const LOOKUP_REVALIDATE_SECONDS = 3600;

export function getPlayerLookupKey() {
  return process.env.STORE_PLAYER_LOOKUP_KEY?.trim() ?? "";
}

export function getPlayerLookupUrl() {
  return (process.env.STORE_PLAYER_LOOKUP_URL?.trim() || DEFAULT_LOOKUP_URL).replace(/\/$/, "");
}

export function isPlayerLookupConfigured() {
  return Boolean(getPlayerLookupKey());
}

export function parseFiveMId(value?: string | number | null) {
  if (value == null) return null;
  const raw = String(value).trim().replace(/^#/, "");
  if (!/^\d+$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function sanitizePlayerUsername(raw?: string | null) {
  if (!raw) return null;
  let name = raw.trim();
  if (name.includes("@")) name = name.split("@")[0] ?? name;
  name = name.replace(/[^\p{L}\p{N}._\- ]/gu, "").trim();
  if (!name) return null;
  if (name.length > 32) return `${name.slice(0, 30)}…`;
  return name;
}

export async function lookupPlayerNames(
  values: Array<string | number | null | undefined>
): Promise<Map<number, string>> {
  const names = new Map<number, string>();
  const apiKey = getPlayerLookupKey();
  if (!apiKey) return names;

  const ids: number[] = [];
  const seen = new Set<number>();
  for (const value of values) {
    const id = parseFiveMId(value);
    if (id == null || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= LOOKUP_LIMIT) break;
  }
  if (!ids.length) return names;

  try {
    const res = await fetch(`${getPlayerLookupUrl()}/api/players/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ ids }),
      signal: AbortSignal.timeout(5000),
      next: { revalidate: LOOKUP_REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      console.error("player lookup failed:", res.status);
      return names;
    }

    const data = (await res.json()) as {
      players?: Array<{ id?: number | string; username?: string | null }>;
    };

    for (const player of data.players ?? []) {
      const id = parseFiveMId(player.id);
      const username = sanitizePlayerUsername(player.username);
      if (id == null || !username) continue;
      names.set(id, username);
    }
  } catch (error) {
    console.error("player lookup:", error);
  }

  return names;
}
