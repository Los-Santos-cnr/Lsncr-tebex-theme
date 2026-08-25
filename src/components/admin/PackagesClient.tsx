"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminMessage } from "@/components/admin/AdminMessage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/format";

export interface AdminPackageRow {
  id: number;
  name: string;
  base_price: number;
  currency: string;
  categoryName: string;
  image: string | null;
}

type Message = { type: "success" | "error"; text: string } | null;

export function PackagesClient({ packages }: { packages: AdminPackageRow[] }) {
  const [message, setMessage] = useState<Message>(null);

  return (
    <div className="space-y-4">
      <AdminMessage message={message} />
      {packages.length ? (
        <div className="grid gap-3">
          {packages.map((pkg) => (
            <PackageRow key={pkg.id} pkg={pkg} onMessage={setMessage} />
          ))}
        </div>
      ) : (
        <div className="lscnr-panel rounded-md px-5 py-8 text-sm text-muted-foreground">
          No packages found. Create packages in the Tebex Creator panel first.
        </div>
      )}
    </div>
  );
}

function PackageRow({
  pkg,
  onMessage,
}: {
  pkg: AdminPackageRow;
  onMessage: (m: Message) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(pkg.name);
  const [price, setPrice] = useState(String(pkg.base_price));
  const [disabled, setDisabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const dirty =
    name !== pkg.name || Number(price) !== pkg.base_price || disabled;

  async function save() {
    setSaving(true);
    onMessage(null);
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          disabled,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onMessage({ type: "error", text: data.error ?? `Failed to update "${pkg.name}".` });
        return;
      }
      onMessage({
        type: "success",
        text: disabled ? `"${name}" updated and disabled.` : `"${name}" updated.`,
      });
      router.refresh();
    } catch {
      onMessage({ type: "error", text: "Network error updating package." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="lscnr-panel flex flex-col gap-3 rounded-md p-4 sm:flex-row sm:items-center">
      <div className="relative hidden h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted sm:block">
        {pkg.image ? (
          <Image src={pkg.image} alt="" fill className="object-cover" sizes="56px" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-display uppercase tracking-widest text-subtle-foreground">
          {pkg.categoryName} · #{pkg.id}
        </p>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div className="flex items-center gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-subtle-foreground">
            Price ({pkg.currency})
          </span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-28"
          />
        </label>
        <label className="flex items-center gap-2 pt-4 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
            className="accent-[color:var(--gold)]"
          />
          Disable
        </label>
      </div>
      <div className="flex items-center gap-3 pt-1 sm:pt-4">
        <span className="hidden text-xs text-subtle-foreground lg:inline">
          {formatPrice(pkg.base_price, pkg.currency)}
        </span>
        <Button variant="gta" size="sm" loading={saving} disabled={!dirty} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
