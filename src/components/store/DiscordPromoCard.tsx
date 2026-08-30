import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { getDiscordInvite } from "@/lib/site";
import { PromoCountdown } from "./PromoCountdown";

export function DiscordPromoCard({ className }: { className?: string }) {
  const invite = getDiscordInvite();

  return (
    <section
      className={cn(
        "cas-cta relative overflow-hidden px-6 py-8 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-8",
        className
      )}
    >
      <div className="max-w-xl space-y-2">
        <p className="lscnr-eyebrow">Community</p>
        <h2 className="lscnr-heading text-2xl text-foreground">Need help or a custom order?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tickets, clothing, liveries, and support live on Discord. Purchases deliver in-game through Tebex.
        </p>
        <PromoCountdown />
      </div>
      {invite ? (
        <Link href={invite} target="_blank" rel="noopener noreferrer" className="mt-5 block sm:mt-0">
          <Button variant="gta" size="lg" className="px-6">
            Open Discord
          </Button>
        </Link>
      ) : (
        <Button variant="gta" size="lg" className="mt-5 px-6 sm:mt-0" disabled>
          Discord soon
        </Button>
      )}
    </section>
  );
}
