import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { orders } from "../../../../../drizzle/schema";
import { db, ensureOrdersTable, isDatabaseConfigured } from "@/lib/db";

function verifyWebhookSignature(body: string, signature: string | null) {
  const secret = process.env.TEBEX_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  if (!signature) return false;

  const expected = createHash("sha256")
    .update(body + secret)
    .digest("hex");

  return expected === signature || signature === secret;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, stored: false });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(payload.type ?? "");
  if (!type.includes("payment") && !type.includes("completed")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const subject = (payload.subject ?? payload.data ?? payload) as Record<string, unknown>;
  const transactionId = String(
    subject.transaction_id ?? subject.id ?? payload.id ?? `tx-${Date.now()}`
  );

  const products = (subject.products ?? subject.packages ?? []) as Array<{
    id?: number;
    name?: string;
    quantity?: number;
    qty?: number;
  }>;

  const packages = products.map((p) => ({
    id: Number(p.id ?? 0),
    name: String(p.name ?? "Package"),
    qty: Number(p.quantity ?? p.qty ?? 1),
  }));

  await ensureOrdersTable();

  try {
    await db
      .insert(orders)
      .values({
        tebexTransactionId: transactionId,
        usernameId: subject.username_id ? String(subject.username_id) : null,
        username: subject.username ? String(subject.username) : null,
        email: subject.email ? String(subject.email) : null,
        currency: String(subject.currency ?? "USD"),
        total: String(subject.price ?? subject.total ?? subject.amount ?? 0),
        status: String(subject.status ?? "complete"),
        packages,
        rawPayload: payload,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error("Webhook store error:", error);
    return NextResponse.json({ error: "Failed to store order" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, stored: true });
}
