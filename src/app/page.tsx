import { StoreShell } from "@/components/layout/StoreShell";
import { PageContainer } from "@/components/ui/PageHeader";
import { DiscordPromoCard } from "@/components/store/DiscordPromoCard";
import { FaqTeaser } from "@/components/store/FaqTeaser";
import { HeroSection } from "@/components/store/HeroSection";
import { HomePackagesSection } from "@/components/store/HomePackagesSection";
import { PackageCard } from "@/components/store/PackageCard";
import { SectionLabel } from "@/components/store/SectionLabel";
import {
  getAllPackages,
  getCategories,
  getMembershipPackages,
  getTopCategories,
  isTebexConfigured,
  categoryHref,
  packagesForTopCategory,
} from "@/lib/tebex";

export default async function HomePage() {
  const configured = isTebexConfigured();
  const categories = configured ? await getCategories(true).catch(() => []) : [];
  const packages = configured ? await getAllPackages().catch(() => []) : [];
  const featured = getMembershipPackages(packages);
  const featuredIds = new Set(featured.map((pkg) => pkg.id));
  const preview = packages.filter((pkg) => !featuredIds.has(pkg.id)).slice(0, 6);
  const topCategories = getTopCategories(categories).map((category) => ({
    ...category,
    packages: packagesForTopCategory(category, categories),
  }));
  const firstCategory = topCategories[0];
  const shopHref = firstCategory ? categoryHref(firstCategory) : "/store";

  return (
    <StoreShell overlayNav>
      <HeroSection categories={categories} />

      <PageContainer className="gap-14 py-12 lg:py-16">
        {featured.length ? (
          <section id="memberships" className="scroll-mt-24 space-y-5">
            <SectionLabel eyebrow="Featured" title="VIP Memberships" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </section>
        ) : null}

        {preview.length || topCategories.length ? (
          <HomePackagesSection
            preview={preview}
            categories={topCategories}
            shopHref={shopHref}
          />
        ) : !featured.length ? (
          <p className="text-sm text-muted-foreground">
            {configured
              ? "No packages found in your Tebex store yet."
              : "Configure NEXT_PUBLIC_TEBEX_PUBLIC_TOKEN to load packages."}
          </p>
        ) : null}

        <DiscordPromoCard />
        <FaqTeaser />
      </PageContainer>
    </StoreShell>
  );
}
