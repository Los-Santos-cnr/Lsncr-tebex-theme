"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Price } from "@/components/store/Price";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardTitle } from "@/components/ui/Card";
import type { AccountSubscription, AccountTransaction } from "@/lib/account";
import { TEBEX_PAYMENT_HISTORY_URL } from "@/lib/site";
import { refreshBasket, signOutCart, useCartStore } from "@/stores/useCartStore";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  const value = status.toLowerCase();
  if (value === "complete" || value === "active") return "success";
  if (value.includes("refund") || value === "ending") return "warning";
  if (value.includes("chargeback") || value.includes("cancel")) return "danger";
  return "neutral";
}

export function AccountPageClient() {
  const username = useCartStore((s) => s.username);
  const usernameId = useCartStore((s) => s.usernameId);
  const basketIdent = useCartStore((s) => s.basketIdent);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const [subscriptions, setSubscriptions] = useState<AccountSubscription[]>([]);
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated || !basketIdent) return;
    refreshBasket().catch(() => undefined);
  }, [hasHydrated, basketIdent]);

  useEffect(() => {
    if (!hasHydrated || (!username && !usernameId)) {
      setSubscriptions([]);
      setTransactions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (username) params.set("username", username);
    if (usernameId) params.set("usernameId", usernameId);

    fetch(`/api/account/purchases?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { subscriptions?: AccountSubscription[]; transactions?: AccountTransaction[] } | null) => {
        if (cancelled) return;
        setSubscriptions(payload?.subscriptions ?? []);
        setTransactions(payload?.transactions ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setSubscriptions([]);
        setTransactions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, username, usernameId]);

  const displayName = username ?? (usernameId ? `User #${usernameId}` : null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl">
          <CardBody className="space-y-4">
            <CardTitle>Your account</CardTitle>
            {displayName ? (
              <p className="text-sm">
                Linked CFX account:{" "}
                <span className="font-semibold text-gold">{displayName}</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No account linked yet. Sign in before checkout.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {!displayName ? (
                <Link href="/login">
                  <Button variant="gta">Login with FiveM</Button>
                </Link>
              ) : null}
              <Link href="/cart">
                <Button variant="secondary">Open cart</Button>
              </Link>
              {displayName ? (
                <Button
                  variant="ghost"
                  className="text-danger"
                  onClick={() => {
                    signOutCart();
                    window.location.reload();
                  }}
                >
                  Sign out
                </Button>
              ) : null}
            </div>
          </CardBody>
        </Card>

        <Card className="rounded-xl">
          <CardBody className="space-y-4">
            <CardTitle>Active subscriptions</CardTitle>
            <p className="text-sm text-muted-foreground">
              End a VIP plan or other recurring package from your Tebex payment history. Perks stay
              active until the current period runs out.
            </p>
            {loading ? (
              <p className="text-sm text-muted-foreground">Checking subscriptions…</p>
            ) : subscriptions.length ? (
              <ul className="divide-y divide-border rounded-md border border-border">
                {subscriptions.map((subscription) => (
                  <li key={subscription.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="min-w-0">
                      {subscription.href ? (
                        <Link href={subscription.href} className="block truncate text-sm font-medium hover:text-gold">
                          {subscription.name}
                        </Link>
                      ) : (
                        <span className="block truncate text-sm font-medium">{subscription.name}</span>
                      )}
                      {subscription.since ? (
                        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          Since {formatWhen(subscription.since)}
                        </span>
                      ) : null}
                    </span>
                    <Badge tone={statusTone(subscription.status)} size="xs">
                      {subscription.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : displayName ? (
              <p className="text-sm text-muted-foreground">No active subscriptions found on this identity.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Link FiveM to see memberships on this account.</p>
            )}
            <Link href={TEBEX_PAYMENT_HISTORY_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="gta">Manage subscriptions</Button>
            </Link>
          </CardBody>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardBody className="space-y-4">
          <CardTitle>Recent transactions</CardTitle>
          {!displayName ? (
            <p className="text-sm text-muted-foreground">
              Link your FiveM account to see purchases on this identity.
            </p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">Loading transactions…</p>
          ) : transactions.length ? (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Item</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {formatWhen(transaction.at)}
                      </td>
                      <td className="px-4 py-3">
                        {transaction.href ? (
                          <Link href={transaction.href} className="font-medium hover:text-gold">
                            {transaction.item}
                          </Link>
                        ) : (
                          <span className="font-medium">{transaction.item}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(transaction.status)} size="xs">
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {transaction.amount == null || Number.isNaN(transaction.amount) ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <Price
                            className="lscnr-price"
                            amount={transaction.amount}
                            from={transaction.currency}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transactions found for this account yet. Completed purchases will show here.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
