"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminMessage } from "@/components/admin/AdminMessage";
import { Button } from "@/components/ui/Button";
import { CardBody } from "@/components/ui/Card";
import { FieldRow, Input } from "@/components/ui/Input";
import type { TebexBan } from "@/lib/tebex-admin";

type Message = { type: "success" | "error"; text: string } | null;

export function BansClient({ initialBans }: { initialBans: TebexBan[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState("");
  const [reason, setReason] = useState("");
  const [ip, setIp] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user.trim() || !reason.trim()) {
      setMessage({ type: "error", text: "Username/UUID and reason are required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/bans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: user.trim(), reason: reason.trim(), ip: ip.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to create ban." });
        return;
      }
      setMessage({ type: "success", text: `${user} banned.` });
      setUser("");
      setReason("");
      setIp("");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error creating ban." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="lscnr-panel rounded-md">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">
            Bans ({initialBans.length})
          </h2>
        </div>
        {initialBans.length ? (
          <ul className="divide-y divide-border">
            {initialBans.map((ban) => (
              <li key={ban.id} className="px-5 py-3">
                <p className="text-sm font-medium">
                  {ban.user?.ign || ban.user?.uuid || ban.ip || `Ban #${ban.id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ban.reason} · {new Date(ban.time).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground">No bans on record.</p>
        )}
      </section>

      <section className="lscnr-panel h-fit rounded-md">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">Create ban</h2>
        </div>
        <CardBody className="p-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <AdminMessage message={message} />
            <FieldRow label="Username or UUID">
              <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="PlayerName" />
            </FieldRow>
            <FieldRow label="Reason">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Chargeback" />
            </FieldRow>
            <FieldRow label="IP address (optional)">
              <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="1.2.3.4" />
            </FieldRow>
            <Button type="submit" variant="danger" className="w-full" loading={saving}>
              Create ban
            </Button>
          </form>
        </CardBody>
      </section>
    </div>
  );
}
