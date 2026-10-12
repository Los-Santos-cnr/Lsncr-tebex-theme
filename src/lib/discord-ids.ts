const SNOWFLAKE = /^\d{17,20}$/;
const DISCORD_KEYS = new Set([
  "discord",
  "discord_id",
  "discordid",
  "discordId",
  "discord_user_id",
  "discordUserId",
  "discord_snowflake",
  "discordSnowflake",
  "discord_user",
  "discordUser",
]);

export function parseDiscordSnowflake(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return parseDiscordSnowflake(String(value));
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (SNOWFLAKE.test(trimmed)) return trimmed;
  const mention = trimmed.match(/^<@!?(\d{17,20})>$/);
  if (mention?.[1]) return mention[1];
  const embedded = trimmed.match(/(?:discord(?:_id|id)?)[:\s#]*(\d{17,20})/i);
  if (embedded?.[1]) return embedded[1];
  return null;
}

function fromRecord(record: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(record)) {
    if (!DISCORD_KEYS.has(key)) continue;
    const direct = parseDiscordSnowflake(value);
    if (direct) return direct;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      const fromNested =
        parseDiscordSnowflake(nested.id) ??
        parseDiscordSnowflake(nested.snowflake) ??
        parseDiscordSnowflake(nested.user_id) ??
        parseDiscordSnowflake(nested.userId);
      if (fromNested) return fromNested;
    }
  }
  return null;
}

function fromVariables(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const name = String(item.identifier ?? item.name ?? item.key ?? "").toLowerCase();
    if (!name.includes("discord")) continue;
    const id =
      parseDiscordSnowflake(item.option) ??
      parseDiscordSnowflake(item.value) ??
      parseDiscordSnowflake(item.data);
    if (id) return id;
  }
  return null;
}

/** Pull a Discord snowflake out of Tebex webhooks, order payloads, or UCP players. */
export function extractDiscordId(value: unknown, depth = 0): string | null {
  if (value == null || depth > 6) return null;
  const direct = parseDiscordSnowflake(value);
  if (direct) return direct;
  if (Array.isArray(value)) {
    const fromVars = fromVariables(value);
    if (fromVars) return fromVars;
    for (const item of value) {
      const nested = extractDiscordId(item, depth + 1);
      if (nested) return nested;
    }
    return null;
  }
  if (typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const fromKeys = fromRecord(record);
  if (fromKeys) return fromKeys;

  const fromCustom = extractDiscordId(record.custom ?? record.variable_data, depth + 1);
  if (fromCustom) return fromCustom;

  const fromProducts = extractDiscordId(record.products ?? record.packages, depth + 1);
  if (fromProducts) return fromProducts;

  const fromSubject = depth === 0 ? extractDiscordId(record.subject ?? record.data, depth + 1) : null;
  if (fromSubject) return fromSubject;

  return fromVariables(record.variables);
}
