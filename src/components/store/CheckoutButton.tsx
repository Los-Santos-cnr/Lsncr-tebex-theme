"use client";

import { Button } from "@/components/ui/Button";
import { FieldRow, Input } from "@/components/ui/Input";
import { Price } from "@/components/store/Price";
import {
  beginDiscordOAuth,
  cartHasGiftcard,
  cartNeedsDiscord,
  cartNeedsFiveM,
  isValidDiscordId,
  isValidEmail,
  startCheckout,
  useCartStore,
} from "@/stores/useCartStore";

export function CheckoutButton({
  total,
  currency,
}: {
  total: number;
  currency: string;
}) {
  const isLoading = useCartStore((s) => s.isLoading);
  const username = useCartStore((s) => s.username);
  const usernameId = useCartStore((s) => s.usernameId);
  const discordId = useCartStore((s) => s.discordId);
  const email = useCartStore((s) => s.email);
  const giftRecipientEmail = useCartStore((s) => s.giftRecipientEmail);
  const localItems = useCartStore((s) => s.localItems);
  const hasEmail = isValidEmail(email);
  const hasFiveM = !cartNeedsFiveM(localItems) || Boolean(username || usernameId);
  const needsDiscord = cartNeedsDiscord(localItems);
  const hasDiscord = !needsDiscord || isValidDiscordId(discordId);
  const hasGiftRecipient =
    !cartHasGiftcard(localItems) || isValidEmail(giftRecipientEmail || email);
  const ready = hasEmail && hasDiscord && hasFiveM && hasGiftRecipient;

  let label = "Checkout";
  if (!hasEmail) label = "Continue";
  else if (needsDiscord && !hasDiscord) label = "Continue with Discord";
  else if (!hasFiveM) label = "Continue with FiveM";
  else label = "Pay";

  return (
    <Button
      variant="primary"
      size="lg"
      className="w-full"
      loading={isLoading}
      onClick={() => startCheckout()}
    >
      {label}
      {ready ? (
        <>
          {" "}
          <Price amount={total} from={currency} />
        </>
      ) : null}
    </Button>
  );
}

export function CheckoutDetails() {
  const username = useCartStore((s) => s.username);
  const usernameId = useCartStore((s) => s.usernameId);
  const discordId = useCartStore((s) => s.discordId);
  const discordUsername = useCartStore((s) => s.discordUsername);
  const setDiscordAccount = useCartStore((s) => s.setDiscordAccount);
  const email = useCartStore((s) => s.email);
  const setEmail = useCartStore((s) => s.setEmail);
  const giftRecipientEmail = useCartStore((s) => s.giftRecipientEmail);
  const setGiftRecipientEmail = useCartStore((s) => s.setGiftRecipientEmail);
  const localItems = useCartStore((s) => s.localItems);
  const notice = useCartStore((s) => s.notice);
  const isLoading = useCartStore((s) => s.isLoading);
  const needsDiscord = cartNeedsDiscord(localItems);
  const needsFiveM = cartNeedsFiveM(localItems);
  const hasGiftcard = cartHasGiftcard(localItems);
  const hasDiscord = isValidDiscordId(discordId);
  const emailError = notice?.tone === "error" && notice.message.toLowerCase().includes("email");
  const discordError = notice?.tone === "error" && notice.message.toLowerCase().includes("discord");

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Before you pay</p>
      <p className="text-xs text-muted-foreground">
        {hasGiftcard && !needsFiveM
          ? "Gift cards are sent by email. Enter who should receive the code."
          : "Memberships and one-off packages need your email, Discord, and FiveM account so we can deliver perks."}
      </p>
      {needsFiveM ? (
        <p className="text-xs text-muted-foreground">
          FiveM: {username ? username : usernameId ? `User #${usernameId}` : "needed for in-game delivery"}
        </p>
      ) : null}
      <FieldRow label="Email">
        <Input
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={email ?? ""}
          onChange={(event) => setEmail(event.target.value)}
        />
      </FieldRow>
      {hasGiftcard ? (
        <FieldRow label="Gift card recipient">
          <Input
            type="email"
            autoComplete="email"
            placeholder="Recipient email (yours if it is for you)"
            value={giftRecipientEmail ?? ""}
            onChange={(event) => setGiftRecipientEmail(event.target.value)}
          />
        </FieldRow>
      ) : null}
      {emailError ? <p className="text-xs text-danger">{notice.message}</p> : null}
      {needsDiscord ? (
        <div className="space-y-2">
          {hasDiscord ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <p>
                Discord:{" "}
                <span className="font-semibold text-gold">
                  {discordUsername || "linked"}
                </span>
              </p>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setDiscordAccount(null, null);
                  fetch("/api/discord/me", { method: "DELETE", cache: "no-store" }).catch(
                    () => undefined
                  );
                }}
              >
                Unlink
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              loading={isLoading}
              onClick={() =>
                beginDiscordOAuth({
                  pendingCheckout: false,
                  returnUrl: `${window.location.origin}/cart`,
                })
              }
            >
              Continue with Discord
            </Button>
          )}
          {discordError ? <p className="text-xs text-danger">{notice.message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function CouponForm() {
  const couponCode = useCartStore((s) => s.couponCode);
  const setCouponCode = useCartStore((s) => s.setCouponCode);

  return (
    <Input
      placeholder="Coupon code (optional)"
      value={couponCode}
      onChange={(event) => setCouponCode(event.target.value)}
    />
  );
}
