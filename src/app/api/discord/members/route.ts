import { NextResponse } from "next/server";

export async function GET() {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID?.trim();
  const botToken = process.env.DISCORD_BOT_TOKEN?.trim();

  if (!guildId) {
    return NextResponse.json({ count: null });
  }

  if (botToken) {
    try {
      const res = await fetch(
        `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
        {
          headers: { Authorization: `Bot ${botToken}` },
          next: { revalidate: 60 },
        }
      );
      if (res.ok) {
        const data = (await res.json()) as { approximate_presence_count?: number };
        return NextResponse.json({
          count: data.approximate_presence_count ?? null,
        });
      }
    } catch {
      // fall through
    }
  }

  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${guildId}/widget.json`,
      { next: { revalidate: 60 } }
    );
    if (res.ok) {
      const data = (await res.json()) as { presence_count?: number };
      return NextResponse.json({ count: data.presence_count ?? null });
    }
  } catch {
    // ignore
  }

  return NextResponse.json({ count: null });
}
