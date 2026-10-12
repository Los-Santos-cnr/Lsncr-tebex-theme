import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { orders } from "../../../../../drizzle/schema";
import { db, ensureOrdersTable, isDatabaseConfigured } from "@/lib/db";
import { identitiesFromTebexWebhook, syncTopSupporterForIdentities } from "@/lib/top-supporter-role";

function verifyWebhookSignature(body: string, signature: string | null) {
  const secret = process.env.TEBEX_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  if (!signature) return false;

  const expected = createHash("sha256")
    .update(body + secret)
    .digest("hex");

  return expected === signature || signature === secret;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asText(value: unknown) {
  if (value == null || typeof value === "object") return null;
  const text = String(value).trim();
  return text || null;
}

function moneyFrom(value: unknown) {
  if (typeof value === "number" || typeof value === "string") return String(value);
  const record = asRecord(value);
  if (record.amount != null) return String(record.amount);
  return "0";
}

function currencyFrom(subject: Record<string, unknown>) {
  const price = asRecord(subject.price);
  const paid = asRecord(subject.price_paid);
  return asText(price.currency) ?? asText(paid.currency) ?? asText(subject.currency) ?? "USD";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(payload.type ?? "");
  if (type === "validation.webhook") {
    return NextResponse.json({ id: payload.id });
  }

  const paymentEvent = type.includes("payment");
  if (!paymentEvent) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const subject = asRecord(payload.subject ?? payload.data ?? payload);
  const customer = asRecord(subject.customer);
  const username = asRecord(customer.username ?? subject.username);
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

  let stored = false;
  if (isDatabaseConfigured()) {
    await ensureOrdersTable();
    try {
      await db
        .insert(orders)
        .values({
          tebexTransactionId: transactionId,
          usernameId: asText(subject.username_id ?? username.id),
          username: asText(username.username ?? subject.username),
          email: asText(subject.email ?? customer.email),
          currency: currencyFrom(subject),
          total: moneyFrom(subject.price_paid ?? subject.price ?? subject.total ?? subject.amount),
          status: asText(asRecord(subject.status).description) ?? asText(subject.status) ?? "complete",
          packages,
          rawPayload: payload,
        })
        .onConflictDoNothing();
      stored = true;
    } catch (error) {
      console.error("Webhook store error:", error);
      return NextResponse.json({ error: "Failed to store order" }, { status: 500 });
    }
  }

  try {
    await syncTopSupporterForIdentities(identitiesFromTebexWebhook(payload));
  } catch (error) {
    console.error("top supporter webhook:", error);
  }

  return NextResponse.json({ ok: true, stored });
}
