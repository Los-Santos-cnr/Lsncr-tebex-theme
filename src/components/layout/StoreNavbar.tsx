"use client";

import { ChevronDown, Menu, ShoppingCart, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CurrencySelector } from "@/components/store/CurrencySelector";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
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
  const localItems = useCartStore((s) => s.localItems);
  const itemCount = localItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!hasHydrated || !basketIdent || basket) return;
    refreshBasket().catch(() => undefined);
  }, [hasHydrated, basketIdent, basket]);

  const shopCategories = getTopCategories(categories);

  return (
    <header
      className={cn(
        "store-navbar sticky top-0 z-50 border-b border-border bg-background/90 chrome-blur",
        overlay && "store-navbar--overlay sticky top-0 border-gold/20 bg-black/40"
      )}
    >
      <div className="mx-auto flex h-12 max-w-[1120px] items-center gap-5 px-4 sm:h-14 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="LSCNR home">
          <BrandLogo priority className="h-8 sm:h-9" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink href="/" active={pathname === "/"}>
            Home
          </NavLink>
          <ShopMenu categories={shopCategories} pathname={pathname} />
          <NavLink href="/supporters" active={pathname === "/supporters"}>
            Top Supporters
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <CurrencySelector className="hidden sm:block" />
          <Link href="/cart" aria-label="Cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-gold px-1 text-[10px] font-bold text-gold-foreground">
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
              variant="outline"
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
              <MobileLink href="/supporters" onNavigate={() => setMobileOpen(false)}>
                Top Supporters
              </MobileLink>
              {shopCategories.length ? (
                <>
                  <p className="mt-4 px-3 text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                    Shop
                  </p>
                  {shopCategories.map((category) => (
                    <MobileLink
                      key={category.id}
                      href={categoryHref(category)}
                      onNavigate={() => setMobileOpen(false)}
                    >
                      {category.name}
                    </MobileLink>
                  ))}
                </>
              ) : null}
              <div className="mt-4 border-t border-border pt-4">
                <CurrencySelector className="w-full" />
                {!username ? (
                  <Button
                    variant="outline"
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

function ShopMenu({
  categories,
  pathname,
}: {
  categories: TebexCategory[];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = categories.some((category) => pathname.startsWith(categoryHref(category)));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!categories.length) return null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-3 py-2 font-display text-xs font-medium uppercase tracking-[0.18em] transition-colors",
          active || open
            ? "nav-tab-active text-gold"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Shop
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-surface p-1 shadow-pop"
        >
          {categories.map((category) => {
            const href = categoryHref(category);
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={category.id}
                href={href}
                role="menuitem"
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
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
        "whitespace-nowrap rounded-sm px-3 py-2 font-display text-xs font-medium uppercase tracking-[0.18em] transition-colors",
        active
          ? "nav-tab-active text-gold"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
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
      className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}
