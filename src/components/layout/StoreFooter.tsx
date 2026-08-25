import Link from "next/link";
import {
  FOOTER_COPYRIGHT,
  getDiscordInvite,
  getMainSiteUrl,
  SITE_NAME,
} from "@/lib/site";

export function StoreFooter() {
  const discord = getDiscordInvite();
  const mainSite = getMainSiteUrl();

  return (
    <footer className="mt-auto border-t border-border bg-surface/60">
      <div className="lscnr-beacon-bar opacity-50" />
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="lscnr-heading text-sm text-foreground">
            {SITE_NAME}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{FOOTER_COPYRIGHT}</p>
        </div>
        <nav className="flex flex-wrap gap-4 font-display text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Link href="/faq" className="hover:text-cop">
            FAQ
          </Link>
          <Link href="/support" className="hover:text-cop">
            Support
          </Link>
          <Link href="/terms" className="hover:text-cop">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-cop">
            Privacy
          </Link>
          {discord ? (
            <Link
              href={discord}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cop"
            >
              Discord
            </Link>
          ) : null}
          <Link
            href={mainSite}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cop"
          >
            Main site
          </Link>
        </nav>
      </div>
    </footer>
  );
}
