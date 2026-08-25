import Link from "next/link";
import { CardBody, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getDiscordInvite } from "@/lib/site";
import { PromoCountdown } from "./PromoCountdown";
import { GlassBadge } from "./GlassBadge";

export function DiscordPromoCard({ className }: { className?: string }) {
  const invite = getDiscordInvite();

  return (
    <div className={className}>
      <div className="lscnr-panel overflow-hidden rounded-sm">
        <div className="lscnr-beacon-bar" />
        <CardBody className="space-y-4 p-6">
          <CardTitle className="lscnr-heading text-2xl text-foreground">Discord Community</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Join our Discord for events, support tickets, custom order requests, and updates from the
            LSCNR team.
          </p>
          <PromoCountdown />
          {invite ? (
            <Link href={invite} target="_blank" rel="noopener noreferrer" className="block">
              <Button variant="gta" size="md" className="w-full">
                Discord Community
              </Button>
            </Link>
          ) : (
            <Button variant="gta" size="md" className="w-full" disabled>
              Discord link soon
            </Button>
          )}
        </CardBody>
      </div>
      <GlassBadge className="mt-4 lg:hidden" />
    </div>
  );
}
