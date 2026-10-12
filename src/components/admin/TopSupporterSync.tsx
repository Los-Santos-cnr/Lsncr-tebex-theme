"use client";

import { useState } from "react";
import { AdminMessage } from "@/components/admin/AdminMessage";
import { Button } from "@/components/ui/Button";
import { CardBody } from "@/components/ui/Card";
import type { TopSupporterSyncResult } from "@/lib/top-supporter-role";

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
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const [result, setResult] = useState<TopSupporterSyncResult | null>(null);

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
