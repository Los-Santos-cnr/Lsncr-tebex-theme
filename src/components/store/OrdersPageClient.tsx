"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Section";
import { formatPrice } from "@/lib/format";
import type { Order } from "../../../drizzle/schema";
import { useCartStore } from "@/stores/useCartStore";

export function OrdersPageClient() {
  const username = useCartStore((s) => s.username);
  const usernameId = useCartStore((s) => s.usernameId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(Boolean(username || usernameId));

  useEffect(() => {
    if (!usernameId && !username) {
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams();
    if (usernameId) params.set("usernameId", usernameId);
    else if (username) params.set("username", username);

    fetch(`/api/orders?${params}`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data: { data: Order[] }) => {
        if (!cancelled) setOrders(data.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username, usernameId]);

  if (!username && !usernameId) {
    return (
      <EmptyState
        title="Sign in to view orders"
        description="Link your FiveM account to see purchase history."
        action={
          <Link href="/login">
            <Button variant="primary">Login</Button>
          </Link>
        }
      />
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading orders…</p>;
  }

  if (!orders.length) {
    return (
      <EmptyState
        title="No orders yet"
        description="Completed purchases will appear here after Tebex webhooks are configured."
        action={
          <Link href="/">
            <Button variant="primary">Browse packages</Button>
          </Link>
        }
      />
    );
  }

  return (
    <Card className="rounded-xl">
      <CardBody className="divide-y divide-border p-0">
        {orders.map((order) => (
          <div key={order.id} className="grid gap-2 px-4 py-4 sm:grid-cols-4 sm:items-center">
            <div>
              <p className="text-xs text-muted-foreground">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString()
                  : "—"}
              </p>
              <p className="font-mono text-[10px] text-subtle-foreground">
                {order.tebexTransactionId}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium">
                {(order.packages ?? [])
                  .map((p) => `${p.name} ×${p.qty}`)
                  .join(", ")}
              </p>
            </div>
            <div className="text-sm font-semibold text-primary">
              {formatPrice(Number(order.total), order.currency)}
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
