"use client";

import { Ban, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminMessage } from "@/components/admin/AdminMessage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardBody } from "@/components/ui/Card";
import { FieldRow, Input } from "@/components/ui/Input";
import type { TebexGiftCard } from "@/lib/tebex-admin";

type Message = { type: "success" | "error"; text: string } | null;

export function GiftCardsClient({ initialCards }: { initialCards: TebexGiftCard[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setMessage({ type: "error", text: "Enter an amount greater than 0." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          note: note.trim() || undefined,
          expires_at: expiresAt ? `${expiresAt} 23:59:59` : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; data?: TebexGiftCard };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to create gift card." });
        return;
      }
      setMessage({
        type: "success",
        text: data.data?.code
          ? `Gift card created: ${data.data.code}`
          : "Gift card created.",
      });
      setAmount("");
      setNote("");
      setExpiresAt("");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error creating gift card." });
    } finally {
      setSaving(false);
    }
  }

  async function handleVoid(id: number, code: string) {
    if (!confirm(`Void gift card ${code}? It can no longer be used.`)) return;
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/gift-cards/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to void gift card." });
        return;
      }
      setMessage({ type: "success", text: `Gift card ${code} voided.` });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error voiding gift card." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleTopUp(id: number, code: string) {
    const input = prompt(`Top up gift card ${code} by how much?`);
    if (input == null) return;
    const value = Number(input);
    if (!value || value <= 0) {
      setMessage({ type: "error", text: "Enter a valid top-up amount." });
      return;
    }
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/gift-cards/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to top up gift card." });
        return;
      }
      setMessage({ type: "success", text: `Gift card ${code} topped up.` });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error topping up gift card." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="lscnr-panel rounded-md">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">
            Gift cards ({initialCards.length})
          </h2>
        </div>
        {initialCards.length ? (
          <ul className="divide-y divide-border">
            {initialCards.map((card) => (
              <li key={card.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{card.code}</span>
                    {card.void ? (
                      <Badge tone="danger" size="xs">
                        Void
                      </Badge>
                    ) : (
                      <Badge tone="success" size="xs">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {card.balance.remaining} / {card.balance.starting} {card.balance.currency}
                    {card.note ? ` · ${card.note}` : ""}
                  </p>
                </div>
                {!card.void ? (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={busyId === card.id}
                      onClick={() => handleTopUp(card.id, card.code)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Top up
                    </Button>
                    <Button
                      variant="danger"
                      size="icon"
                      loading={busyId === card.id}
                      onClick={() => handleVoid(card.id, card.code)}
                      aria-label={`Void ${card.code}`}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground">No gift cards yet.</p>
        )}
      </section>

      <section className="lscnr-panel h-fit rounded-md">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">Create gift card</h2>
        </div>
        <CardBody className="p-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <AdminMessage message={message} />
            <FieldRow label="Amount">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25.00"
              />
            </FieldRow>
            <FieldRow label="Note (optional)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Giveaway prize" />
            </FieldRow>
            <FieldRow label="Expires (optional)">
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </FieldRow>
            <Button type="submit" variant="gta" className="w-full" loading={saving}>
              Create gift card
            </Button>
          </form>
        </CardBody>
      </section>
    </div>
  );
}
