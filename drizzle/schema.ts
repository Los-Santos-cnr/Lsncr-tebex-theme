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
