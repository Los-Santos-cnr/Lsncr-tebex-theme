import Image from "next/image";
import Link from "next/link";
import { Gamepad2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  HOME_EYEBROW,
  HOME_HEADLINE,
  HOME_SUBTITLE,
  getDiscordInvite,
  getFiveMConnectUrl,
  getHeroImage,
} from "@/lib/site";
import type { TebexCategory } from "@/lib/tebex-types";
import { categoryHref, getTopCategories } from "@/lib/tebex";
import { SocialProofBar } from "./SocialProofBar";

export function HeroSection({
  categories = [],
  heroFallbackImage,
}: {
  categories?: TebexCategory[];
  heroFallbackImage?: string | null;
}) {
  const configuredHero = getHeroImage();
  const heroImage =
    configuredHero?.startsWith("http") ? configuredHero : heroFallbackImage ?? null;
  const discord = getDiscordInvite();
  const fivem = getFiveMConnectUrl();
  const firstCategory = getTopCategories(categories)[0];
  const shopHref = firstCategory ? categoryHref(firstCategory) : "/store";

  return (
    <section className="hero-banner relative overflow-hidden border-b border-border">
      <div className="absolute inset-0">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="lscnr-asphalt h-full" />
        )}
        <div className="absolute inset-0 lscnr-hero-overlay" />
        <div className="lscnr-noise absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-24">
        <p className="lscnr-eyebrow">{HOME_EYEBROW}</p>

        <h1 className="lscnr-heading text-4xl text-foreground sm:text-5xl lg:text-[3.5rem]">
          {HOME_HEADLINE}
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
          {HOME_SUBTITLE}
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <Link href={fivem} target="_blank" rel="noopener noreferrer">
            <Button variant="gta" size="lg" className="gap-2">
              <Gamepad2 className="h-4 w-4" />
              Click to Play
            </Button>
          </Link>
          {shopHref ? (
            <Link href={shopHref}>
              <Button
                variant="outline"
                size="lg"
                className="border-white/25 bg-black/20 text-white hover:border-white/35 hover:bg-black/30 hover:text-white"
              >
                Browse packages
              </Button>
            </Link>
          ) : null}
          {discord ? (
            <Link href={discord} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/25 bg-black/20 text-white hover:border-white/35 hover:bg-black/30 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                Discord Community
              </Button>
            </Link>
          ) : null}
        </div>

        <SocialProofBar className="pt-2" />
      </div>
    </section>
  );
}
