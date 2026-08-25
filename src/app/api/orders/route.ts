import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { orders } from "../../../../drizzle/schema";
import { db, ensureOrdersTable, isDatabaseConfigured } from "@/lib/db";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ data: [] });
  }

  const { searchParams } = new URL(request.url);
  const usernameId = searchParams.get("usernameId");
  const username = searchParams.get("username");

  if (!usernameId && !username) {
    return NextResponse.json({ error: "usernameId or username required" }, { status: 400 });
  }

  await ensureOrdersTable();

  const rows = await db
    .select()
    .from(orders)
    .where(
      usernameId
        ? eq(orders.usernameId, usernameId)
        : eq(orders.username, username!)
    )
    .orderBy(desc(orders.createdAt));

  return NextResponse.json({ data: rows });
}
