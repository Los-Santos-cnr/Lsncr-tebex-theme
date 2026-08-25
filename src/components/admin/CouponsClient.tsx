"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminMessage } from "@/components/admin/AdminMessage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CardBody } from "@/components/ui/Card";
import { FieldRow, Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { TebexCoupon } from "@/lib/tebex-admin";

type Message = { type: "success" | "error"; text: string } | null;

export function CouponsClient({ initialCoupons }: { initialCoupons: TebexCoupon[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "value">("percentage");
  const [amount, setAmount] = useState("");
  const [effectiveOn, setEffectiveOn] = useState<"cart" | "package" | "category">("cart");
  const [targetIds, setTargetIds] = useState("");
  const [basketType, setBasketType] = useState<"single" | "subscription" | "both">("single");
  const [minimum, setMinimum] = useState("");
  const [redeemUnlimited, setRedeemUnlimited] = useState(true);
  const [expireLimit, setExpireLimit] = useState("");
  const [expireNever, setExpireNever] = useState(true);
  const [expireDate, setExpireDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [username, setUsername] = useState("");
  const [note, setNote] = useState("");

  function parseIds(value: string) {
    return value
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const numAmount = Number(amount);
    if (!code.trim()) {
      setMessage({ type: "error", text: "Coupon code is required." });
      setSaving(false);
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setMessage({ type: "error", text: "Enter a discount amount greater than 0." });
      setSaving(false);
      return;
    }

    const payload = {
      code: code.trim(),
      effective_on: effectiveOn,
      packages: effectiveOn === "package" ? parseIds(targetIds) : undefined,
      categories: effectiveOn === "category" ? parseIds(targetIds) : undefined,
      discount_type: discountType,
      discount_amount: discountType === "value" ? numAmount : 0,
      discount_percentage: discountType === "percentage" ? numAmount : 0,
      redeem_unlimited: redeemUnlimited,
      expire_never: expireNever,
      expire_limit: !redeemUnlimited && expireLimit ? Number(expireLimit) : 0,
      expire_date: !expireNever && expireDate ? expireDate : undefined,
      start_date: startDate || undefined,
      basket_type: basketType,
      minimum: minimum ? Number(minimum) : 0,
      username: username.trim() || undefined,
      note: note.trim() || undefined,
    };

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to create coupon." });
        return;
      }
      setMessage({ type: "success", text: `Coupon "${payload.code}" created.` });
      setCode("");
      setAmount("");
      setTargetIds("");
      setMinimum("");
      setNote("");
      setUsername("");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error creating coupon." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, couponCode: string) {
    if (!confirm(`Delete coupon "${couponCode}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to delete coupon." });
        return;
      }
      setMessage({ type: "success", text: `Coupon "${couponCode}" deleted.` });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Network error deleting coupon." });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="lscnr-panel rounded-md">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">
            Active coupons ({initialCoupons.length})
          </h2>
        </div>
        {initialCoupons.length ? (
          <ul className="divide-y divide-border">
            {initialCoupons.map((coupon) => (
              <li key={coupon.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{coupon.code}</span>
                    <Badge tone="primary" size="xs">
                      {coupon.discount.type === "percentage"
                        ? `${coupon.discount.percentage}%`
                        : `${coupon.discount.value} off`}
                    </Badge>
                    <Badge tone="neutral" size="xs">
                      {coupon.effective.type}
                    </Badge>
                  </div>
                  {coupon.note ? (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{coupon.note}</p>
                  ) : null}
                </div>
                <Button
                  variant="danger"
                  size="icon"
                  loading={deletingId === coupon.id}
                  onClick={() => handleDelete(coupon.id, coupon.code)}
                  aria-label={`Delete ${coupon.code}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-sm text-muted-foreground">No coupons yet.</p>
        )}
      </section>

      <section className="lscnr-panel h-fit rounded-md">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">Create coupon</h2>
        </div>
        <CardBody className="p-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <AdminMessage message={message} />
            <FieldRow label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="SUMMER25" />
            </FieldRow>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Discount type">
                <Select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percentage" | "value")}
                >
                  <option value="percentage">Percentage</option>
                  <option value="value">Fixed value</option>
                </Select>
              </FieldRow>
              <FieldRow label={discountType === "percentage" ? "Percent (%)" : "Amount"}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={discountType === "percentage" ? "25" : "5.00"}
                />
              </FieldRow>
            </div>
            <FieldRow label="Applies to">
              <Select
                value={effectiveOn}
                onChange={(e) =>
                  setEffectiveOn(e.target.value as "cart" | "package" | "category")
                }
              >
                <option value="cart">Whole cart</option>
                <option value="package">Specific packages</option>
                <option value="category">Specific categories</option>
              </Select>
            </FieldRow>
            {effectiveOn !== "cart" ? (
              <FieldRow label={`${effectiveOn === "package" ? "Package" : "Category"} IDs (comma-separated)`}>
                <Input
                  value={targetIds}
                  onChange={(e) => setTargetIds(e.target.value)}
                  placeholder="1234, 5678"
                />
              </FieldRow>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Basket type">
                <Select
                  value={basketType}
                  onChange={(e) =>
                    setBasketType(e.target.value as "single" | "subscription" | "both")
                  }
                >
                  <option value="single">Single</option>
                  <option value="subscription">Subscription</option>
                  <option value="both">Both</option>
                </Select>
              </FieldRow>
              <FieldRow label="Min. basket value">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={minimum}
                  onChange={(e) => setMinimum(e.target.value)}
                  placeholder="0"
                />
              </FieldRow>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={redeemUnlimited}
                onChange={(e) => setRedeemUnlimited(e.target.checked)}
                className="accent-[color:var(--gold)]"
              />
              Unlimited redemptions
            </label>
            {!redeemUnlimited ? (
              <FieldRow label="Redemption limit">
                <Input
                  type="number"
                  min="1"
                  value={expireLimit}
                  onChange={(e) => setExpireLimit(e.target.value)}
                  placeholder="100"
                />
              </FieldRow>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={expireNever}
                onChange={(e) => setExpireNever(e.target.checked)}
                className="accent-[color:var(--gold)]"
              />
              Never expires
            </label>
            {!expireNever ? (
              <FieldRow label="Expiry date">
                <Input type="date" value={expireDate} onChange={(e) => setExpireDate(e.target.value)} />
              </FieldRow>
            ) : null}

            <FieldRow label="Start date (optional)">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FieldRow>
            <FieldRow label="Restrict to username (optional)">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Player name" />
            </FieldRow>
            <FieldRow label="Note (optional)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal note" />
            </FieldRow>

            <Button type="submit" variant="gta" className="w-full" loading={saving}>
              Create coupon
            </Button>
          </form>
        </CardBody>
      </section>
    </div>
  );
}
