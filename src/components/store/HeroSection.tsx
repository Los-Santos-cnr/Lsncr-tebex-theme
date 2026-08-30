import Image from "next/image";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SocialProofBar } from "@/components/store/SocialProofBar";
import {
  HOME_EYEBROW,
  HOME_HEADLINE,
  HOME_SUBTITLE,
  getFiveMConnectUrl,
  getHeroImage,
} from "@/lib/site";
import type { TebexCategory } from "@/lib/tebex-types";
import { categoryHref, getTopCategories } from "@/lib/tebex";

const DEFAULT_HERO = "/hero.png";

export function HeroSection({
  categories = [],
}: {
  categories?: TebexCategory[];
}) {
  const configuredHero = getHeroImage();
  const heroImage =
    configuredHero?.startsWith("http") || configuredHero?.startsWith("/")
      ? configuredHero
      : DEFAULT_HERO;
  const fivem = getFiveMConnectUrl();
  const firstCategory = getTopCategories(categories)[0];
  const shopHref = firstCategory ? categoryHref(firstCategory) : "/store";

  return (
    <section className="hero-banner relative overflow-hidden">
      <div className="hero-kenburns absolute inset-0">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          className="object-cover object-[center_35%]"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 lscnr-hero-overlay" />
      <div className="hero-particles" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} />
        ))}
      </div>

      <div className="relative z-10 mx-auto flex min-h-[34rem] w-full max-w-[1120px] flex-col justify-center px-4 pb-16 pt-28 sm:min-h-[40rem] sm:px-6 lg:min-h-[44rem]">
        <p className="lscnr-eyebrow flex items-center gap-2">
          <span className="hero-live" />
          {HOME_EYEBROW}
        </p>
        <h1 className="lscnr-heading mt-4 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">
          {HOME_HEADLINE}
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {HOME_SUBTITLE}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="#memberships">
            <Button variant="gta" size="lg" className="px-6">
              Shop VIP
            </Button>
          </Link>
          <Link href={fivem} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 border-white/25 bg-black/40 px-5 text-white hover:border-gold hover:text-gold"
            >
              <Gamepad2 className="h-4 w-4" />
              Connect
            </Button>
          </Link>
          <Link href={shopHref}>
            <Button variant="ghost" size="lg" className="text-white/70 hover:text-white">
              Browse store
            </Button>
          </Link>
        </div>
        <SocialProofBar className="mt-8 justify-start" />
      </div>
    </section>
  );
}
