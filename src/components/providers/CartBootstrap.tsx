"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { cn } from "@/components/ui/cn";
import { finishAuthReturn, finishDiscordReturn, useCartStore } from "@/stores/useCartStore";

function CartNotice() {
  const notice = useCartStore((s) => s.notice);
  const setNotice = useCartStore((s) => s.setNotice);

  useEffect(() => {
    if (!notice || notice.tone === "error") return;
    const timer = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [notice, setNotice]);

  if (!notice) return null;

  return (
    <aside
      role={notice.tone === "error" ? "alert" : "status"}
      className="purchase-toast purchase-toast--in pointer-events-none fixed bottom-24 right-4 z-[60] w-[min(calc(100%-2rem),22rem)]"
    >
      <div
        className={cn(
          "pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5 shadow-pop chrome-blur",
          notice.tone === "error"
            ? "border-danger/40 bg-black/90 text-danger"
            : "border-gold/25 bg-black/85 text-foreground"
        )}
      >
        <p className="text-sm">{notice.message}</p>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setNotice(null)}
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}

function LinkingOverlay() {
  const linkingMessage = useCartStore((s) => s.linkingMessage);
  if (!linkingMessage) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
      <div className="lscnr-panel w-full max-w-md rounded-lg p-6 text-center">
        <p className="lscnr-heading text-lg">{linkingMessage}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Stay on this page. We will send you back as soon as the link is ready.
        </p>
      </div>
    </div>
  );
}

function CartBootstrapInner() {
  const searchParams = useSearchParams();
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;

    try {
      if (sessionStorage.getItem("lscnr-last-auth") === "discord") {
        sessionStorage.removeItem("lscnr-last-auth");
        useCartStore.getState().setLinkingMessage(null);
      }
    } catch {
      // ignore
    }

    const discordError = searchParams.get("discord_error");
    if (discordError) {
      const messages: Record<string, string> = {
        not_configured: "Discord login is not configured on this store yet.",
        denied: "Discord login was cancelled.",
        invalid_state: "Discord login expired. Try again.",
        token: "Discord login failed. Try again.",
      };
      useCartStore.getState().setNotice({
        tone: "error",
        message: messages[discordError] || "Discord login failed. Try again.",
      });
      useCartStore.getState().setLinkingMessage(null);
    }

    if (searchParams.get("discord") === "1") {
      finishDiscordReturn().catch(() => undefined);
      return;
    }

    const authReturn =
      searchParams.get("success") === "true" || searchParams.get("auth") === "1";

    if (!authReturn) return;
    finishAuthReturn().catch(() => {
      useCartStore.getState().setNotice({
        tone: "error",
        message: "Account linking did not finish. Try checkout again.",
      });
      useCartStore.getState().setLinkingMessage(null);
    });
  }, [hasHydrated, searchParams]);

  return (
    <>
      <CartNotice />
      <LinkingOverlay />
    </>
  );
}

export function CartBootstrap() {
  return (
    <Suspense fallback={null}>
      <CartBootstrapInner />
    </Suspense>
  );
}
