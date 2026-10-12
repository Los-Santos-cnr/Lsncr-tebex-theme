import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "../../drizzle/schema";

export const db = drizzle(sql, { schema });

export function isDatabaseConfigured() {
  return Boolean(process.env.POSTGRES_URL?.trim());
}

export async function ensureOrdersTable() {
  if (!isDatabaseConfigured()) return;

  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      tebex_transaction_id TEXT NOT NULL UNIQUE,
      username_id TEXT,
      username TEXT,
      email TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      total NUMERIC(10, 2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'complete',
      packages JSONB NOT NULL,
      raw_payload JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

export async function ensureTopSupporterTables() {
  if (!isDatabaseConfigured()) return;

  await sql`
    CREATE TABLE IF NOT EXISTS player_discord_links (
      fivem_id TEXT PRIMARY KEY,
      discord_id TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS top_supporter_grants (
      discord_id TEXT PRIMARY KEY,
      fivem_id TEXT,
      spend_usd NUMERIC(12, 2),
      granted_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}
