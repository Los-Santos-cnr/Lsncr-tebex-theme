import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { PageContainer } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { CategoryShowcase } from "@/components/store/CategoryShowcase";
import { FaqTeaser } from "@/components/store/FaqTeaser";
import { HeroSection } from "@/components/store/HeroSection";
import { OfferingCards } from "@/components/store/OfferingCards";
import { PackageCard } from "@/components/store/PackageCard";
import { SectionLabel } from "@/components/store/SectionLabel";
import { getAllPackages, getCategories, getTopCategories, isTebexConfigured, categoryHref } from "@/lib/tebex";

export default async function HomePage() {
  const configured = isTebexConfigured();
  const categories = configured ? await getCategories(true).catch(() => []) : [];
  const packages = configured ? await getAllPackages().catch(() => []) : [];
  const featured = packages.slice(0, 6);
  const heroFallbackImage = categories[0]?.packages?.[0]?.image ?? null;
  const firstCategory = getTopCategories(categories)[0];
  const shopHref = firstCategory ? categoryHref(firstCategory) : null;

  return (
    <StoreShell overlayNav>
      <HeroSection categories={categories} heroFallbackImage={heroFallbackImage} />

      <PageContainer className="gap-14 py-12">
        <section>
          <OfferingCards />
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <SectionLabel eyebrow="Package Spotlight" title="Most Popular Packages" />
            {shopHref ? (
              <Link href={shopHref}>
                <Button variant="outline" className="border-border-strong">
                  View all packages
                </Button>
              </Link>
            ) : null}
          </div>
          {featured.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} variant="spotlight" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {configured
                ? "No packages found in your Tebex store yet."
                : "Configure NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN to load packages."}
            </p>
          )}
        </section>

        {categories.length ? (
          <section className="space-y-6">
            <SectionLabel eyebrow="Browse" title="Shop By Category" />
            <CategoryShowcase categories={categories} />
          </section>
        ) : null}

        <section>
          <FaqTeaser />
        </section>
      </PageContainer>
    </StoreShell>
  );
}
