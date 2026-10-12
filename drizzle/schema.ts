import { pgTable, serial, text, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tebexTransactionId: text("tebex_transaction_id").notNull().unique(),
  usernameId: text("username_id"),
  username: text("username"),
  email: text("email"),
  currency: text("currency").notNull().default("USD"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("complete"),
  packages: jsonb("packages").$type<{ id: number; name: string; qty: number }[]>().notNull(),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const playerDiscordLinks = pgTable("player_discord_links", {
  fivemId: text("fivem_id").primaryKey(),
  discordId: text("discord_id").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const topSupporterGrants = pgTable("top_supporter_grants", {
  discordId: text("discord_id").primaryKey(),
  fivemId: text("fivem_id"),
  spendUsd: numeric("spend_usd", { precision: 12, scale: 2 }),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
});
