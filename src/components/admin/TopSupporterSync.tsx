"use client";

import { useEffect, useState } from "react";
import { AdminMessage } from "@/components/admin/AdminMessage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardBody } from "@/components/ui/Card";
import { formatPrice } from "@/lib/format";
import type { RecentTopSpender, TopSupporterSyncResult } from "@/lib/top-supporter-role";

type Message = { type: "success" | "error"; text: string } | null;

function summarize(result: TopSupporterSyncResult) {
  const parts = [
    `${result.qualified} qualified`,
    `${result.granted} granted`,
    `${result.alreadyHad} already had it`,
    `${result.revoked} revoked`,
  ];
  if (result.skippedNoDiscord) parts.push(`${result.skippedNoDiscord} missing Discord`);
  if (result.skippedNotInGuild) parts.push(`${result.skippedNotInGuild} not in the Discord`);
  return parts.join(" · ");
}

export function TopSupporterSync() {
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | "load" | null>("load");
  const [result, setResult] = useState<Pick<
    TopSupporterSyncResult,
    "payments" | "thresholdUsd" | "windowDays"
  > | null>(null);
  const [leaders, setLeaders] = useState<RecentTopSpender[]>([]);

  async function loadLeaders() {
    setBusy("load");
    try {
      const res = await fetch("/api/admin/top-supporter-role");
      const data = (await res.json().catch(() => ({}))) as {
        payments?: number;
        thresholdUsd?: number;
        windowDays?: number;
        leaders?: RecentTopSpender[];
        error?: string;
        errors?: string[];
      };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Could not load 90-day spenders." });
        return;
      }
      setLeaders(data.leaders ?? []);
      setResult({
        payments: data.payments ?? 0,
        thresholdUsd: data.thresholdUsd ?? 500,
        windowDays: data.windowDays ?? 90,
      });
      if (data.errors?.[0]) setMessage({ type: "error", text: data.errors[0] });
    } catch {
      setMessage({ type: "error", text: "Network error loading 90-day spenders." });
    } finally {
      setBusy(null);
    }
  }

  useEffect(() => {
    void loadLeaders();
  }, []);

  async function run(apply: boolean) {
    setBusy(apply ? "apply" : "preview");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/top-supporter-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply }),
      });
      const data = (await res.json().catch(() => ({}))) as TopSupporterSyncResult & { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Top Supporter sync failed." });
        return;
      }
      setResult(data);
      if (data.leaders) setLeaders(data.leaders);
      const prefix = apply ? "Synced" : "Preview";
      const text = `${prefix}: ${summarize(data)}`;
      setMessage({
        type: data.errors?.length ? "error" : "success",
        text: data.errors?.length ? `${text}. ${data.errors[0]}` : text,
      });
    } catch {
      setMessage({ type: "error", text: "Network error running Top Supporter sync." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="lscnr-panel rounded-md">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide">Top Supporter role</h2>
      </div>
      <CardBody className="space-y-3 p-5">
        <p className="text-sm text-muted-foreground">
          Players who spent at least $500 USD in the last 90 days get Discord role{" "}
          <code className="text-gold">1272082144319115305</code>. Past Tebex payments count. The
          role is removed when they drop below that rolling total.
        </p>
        <AdminMessage message={message} />
        {result ? (
          <p className="text-xs text-subtle-foreground">
            {result.payments} payments scanned · ${result.thresholdUsd}+ / {result.windowDays} days
          </p>
        ) : null}

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-subtle-foreground">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Player</th>
                <th className="px-3 py-2 text-right font-medium">90-day spend</th>
                <th className="px-3 py-2 text-right font-medium">To $500</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leaders.length ? (
                leaders.map((leader) => (
                  <tr key={leader.fivemId}>
                    <td className="px-3 py-2 text-muted-foreground">{leader.rank}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{leader.name ?? `#${leader.fivemId}`}</p>
                      {leader.name ? (
                        <p className="text-xs text-muted-foreground">#{leader.fivemId}</p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="lscnr-price">{formatPrice(leader.usd, "USD")}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      {leader.qualified ? (
                        <Badge tone="success" size="xs">
                          Qualified
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          {formatPrice(leader.remainingUsd, "USD")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {busy === "load"
                      ? "Loading 90-day spenders…"
                      : "No complete payments in the last 90 days."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" loading={busy === "preview"} onClick={() => run(false)}>
            Preview
          </Button>
          <Button variant="primary" loading={busy === "apply"} onClick={() => run(true)}>
            Sync roles
          </Button>
        </div>
      </CardBody>
    </section>
  );
}
