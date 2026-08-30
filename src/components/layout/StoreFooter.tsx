import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import {
  FOOTER_COPYRIGHT,
  getDiscordInvite,
  getMainSiteUrl,
} from "@/lib/site";

export function StoreFooter() {
  const discord = getDiscordInvite();
  const mainSite = getMainSiteUrl();

  return (
    <footer className="mt-auto border-t border-border bg-black">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-3">
          <BrandLogo className="h-9" />
          <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
            {FOOTER_COPYRIGHT}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <Link href="/supporters" className="hover:text-gold">
            Top Supporters
          </Link>
          <Link href="/faq" className="hover:text-gold">
            FAQ
          </Link>
          <Link href="/support" className="hover:text-gold">
            Support
          </Link>
          <Link href="/terms" className="hover:text-gold">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-gold">
            Privacy
          </Link>
          {discord ? (
            <Link href={discord} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
              Discord
            </Link>
          ) : null}
          <Link href={mainSite} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
            Main site
          </Link>
        </nav>
      </div>
    </footer>
  );
}
