"use client";

import { Menu, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { CurrencySelector } from "@/components/store/CurrencySelector";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { SITE_NAME } from "@/lib/site";
import { categoryHref, getTopCategories } from "@/lib/tebex";
import type { TebexCategory } from "@/lib/tebex-types";
import { refreshBasket, useCartStore } from "@/stores/useCartStore";

export function StoreNavbar({
  categories,
  overlay = false,
}: {
  categories: TebexCategory[];
  overlay?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const basketIdent = useCartStore((s) => s.basketIdent);
  const basket = useCartStore((s) => s.basket);
  const username = useCartStore((s) => s.username);
  const usernameId = useCartStore((s) => s.usernameId);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const itemCount =
    basket?.packages?.reduce((sum, item) => sum + (item.qty ?? 1), 0) ?? 0;

  useEffect(() => {
    if (!hasHydrated || !basketIdent || basket) return;
    refreshBasket().catch(() => undefined);
  }, [hasHydrated, basketIdent, basket]);

  const topCategories = getTopCategories(categories);

  return (
    <header
      className={cn(
        "store-navbar sticky top-0 z-50 border-b border-border bg-background/90 chrome-blur",
        overlay && "border-border/50 bg-background/70"
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="lscnr-logo-badge flex h-9 w-9 items-center justify-center rounded-sm border border-border/50 font-display text-lg font-extrabold">
            L
          </span>
          <span className="hidden sm:inline">
            <span className="lscnr-heading block text-base leading-none text-foreground">
              {SITE_NAME}
            </span>
            <span className="mt-0.5 block font-display text-[10px] font-semibold uppercase tracking-[0.2em]">
              <span className="text-cop">Cops</span>
              <span className="text-muted-foreground"> & </span>
              <span className="text-robber">Robbers</span>
            </span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          <NavLink href="/" active={pathname === "/"}>
            Home
          </NavLink>
          {topCategories.map((category) => (
            <CategoryNavItem key={category.id} category={category} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <CurrencySelector className="hidden sm:block" />
          <ThemeToggle />
          <Link href="/cart" aria-label="Cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-cop px-1 font-display text-[10px] font-bold text-cop-foreground">
                  {itemCount}
                </span>
              ) : null}
            </Button>
          </Link>

          {username || usernameId ? (
            <Link href="/account">
              <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
                <User className="h-3.5 w-3.5" />
                {username ?? `User #${usernameId}`}
              </Button>
            </Link>
          ) : (
            <Button
              variant="pill"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => router.push("/login")}
            >
              Link FiveM
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-border bg-surface shadow-pop">
            <div className="lscnr-beacon-bar" />
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="lscnr-heading text-sm">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
              <MobileLink href="/" onNavigate={() => setMobileOpen(false)}>
                Home
              </MobileLink>
              {topCategories.map((category) => (
                <MobileLink
                  key={category.id}
                  href={categoryHref(category)}
                  onNavigate={() => setMobileOpen(false)}
                >
                  {category.name}
                </MobileLink>
              ))}
              <div className="mt-4 border-t border-border pt-4">
                <CurrencySelector className="w-full" />
                {!username ? (
                  <Button
                    variant="pill"
                    className="mt-3 w-full"
                    onClick={() => {
                      setMobileOpen(false);
                      router.push("/login");
                    }}
                  >
                    Link FiveM
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-sm px-3 py-2 font-display text-xs font-semibold uppercase tracking-wider transition-colors",
        active
          ? "nav-tab-active bg-cop/10 text-cop"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function CategoryNavItem({
  category,
  pathname,
}: {
  category: TebexCategory;
  pathname: string;
}) {
  const href = categoryHref(category);
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "rounded-sm px-3 py-2 font-display text-xs font-semibold uppercase tracking-wider transition-colors",
        active
          ? "nav-tab-active bg-cop/10 text-cop"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {category.name}
    </Link>
  );
}

function MobileLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-sm px-3 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
