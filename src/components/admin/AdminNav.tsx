"use client";

import {
  Ban,
  Gift,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Tag,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, exact: false },
  { href: "/admin/gift-cards", label: "Gift cards", icon: Gift, exact: false },
  { href: "/admin/packages", label: "Shop items", icon: Package, exact: false },
  { href: "/admin/sales", label: "Sales", icon: Tag, exact: false },
  { href: "/admin/payments", label: "Payments", icon: Receipt, exact: false },
  { href: "/admin/bans", label: "Bans", icon: Ban, exact: false },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-gold/12 text-gold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {link.label}
          </Link>
        );
      })}
      <Button variant="ghost" size="sm" className="mt-3 justify-start gap-2.5" onClick={logout}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </nav>
  );
}
