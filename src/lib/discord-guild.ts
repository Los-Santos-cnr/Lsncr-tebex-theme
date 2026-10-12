import { parseDiscordSnowflake } from "./discord-ids";

const API = "https://discord.com/api/v10";

export function getDiscordGuildId() {
  return process.env.NEXT_PUBLIC_DISCORD_GUILD_ID?.trim() ?? "";
}

export function getDiscordBotToken() {
  return process.env.DISCORD_BOT_TOKEN?.trim() ?? "";
}

export function getTopSupporterRoleId() {
  return process.env.DISCORD_TOP_SUPPORTER_ROLE_ID?.trim() || "1272082144319115305";
}

export function isDiscordRoleSyncConfigured() {
  return Boolean(getDiscordGuildId() && getDiscordBotToken() && getTopSupporterRoleId());
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function discordFetch(path: string, init?: RequestInit, retries = 2) {
  const token = getDiscordBotToken();
  if (!token) throw new Error("DISCORD_BOT_TOKEN is not configured");

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bot ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (res.status === 429 && retries > 0) {
    const retryAfter = Number(res.headers.get("retry-after") ?? 1);
    await sleep(Math.min(Math.max(retryAfter, 0.25), 5) * 1000);
    return discordFetch(path, init, retries - 1);
  }

  return res;
}

export type DiscordRoleResult =
  | "granted"
  | "already"
  | "revoked"
  | "missing"
  | "not_in_guild"
  | "forbidden"
  | "error";

export async function addGuildMemberRole(discordId: string, roleId = getTopSupporterRoleId()) {
  const guildId = getDiscordGuildId();
  const userId = parseDiscordSnowflake(discordId);
  if (!guildId || !userId || !roleId) return "error" as const;

  const memberRes = await discordFetch(`/guilds/${guildId}/members/${userId}`);
  if (memberRes.status === 404) return "not_in_guild" as const;
  if (memberRes.status === 403) return "forbidden" as const;
  if (!memberRes.ok) return "error" as const;

  const member = (await memberRes.json().catch(() => null)) as { roles?: string[] } | null;
  if (member?.roles?.includes(roleId)) return "already" as const;

  const res = await discordFetch(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
  });
  if (res.status === 204 || res.ok) return "granted" as const;
  if (res.status === 404) return "not_in_guild" as const;
  if (res.status === 403) return "forbidden" as const;
  return "error" as const;
}

export async function removeGuildMemberRole(discordId: string, roleId = getTopSupporterRoleId()) {
  const guildId = getDiscordGuildId();
  const userId = parseDiscordSnowflake(discordId);
  if (!guildId || !userId || !roleId) return "error" as const;

  const res = await discordFetch(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "DELETE",
  });
  if (res.status === 204 || res.ok) return "revoked" as const;
  if (res.status === 404) return "missing" as const;
  if (res.status === 403) return "forbidden" as const;
  return "error" as const;
}
