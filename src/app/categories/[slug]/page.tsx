import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { PackageCard } from "@/components/store/PackageCard";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Section";
import {
  getCategories,
  getChildCategories,
  isTebexConfigured,
} from "@/lib/tebex";
import { excerpt } from "@/lib/format";
import type { TebexPackage } from "@/lib/tebex-types";

function PackageGrid({ packages }: { packages: TebexPackage[] }) {
  if (!packages.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {packages.map((pkg) => (
        <PackageCard key={pkg.id} pkg={pkg} variant="grid" />
      ))}
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = isTebexConfigured()
    ? await getCategories(true).catch(() => [])
    : [];
  const category =
    categories.find((c) => c.slug === slug) ??
    categories.find((c) => String(c.id) === slug) ??
    null;
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!isTebexConfigured()) {
    return (
      <StoreShell>
        <PageContainer>
          <EmptyState title="Tebex not configured" description="Add API keys to load categories." />
        </PageContainer>
      </StoreShell>
    );
  }

  const categories = await getCategories(true).catch(() => []);
  const category =
    categories.find((c) => c.slug === slug) ??
    categories.find((c) => String(c.id) === slug) ??
    null;
  if (!category) notFound();

  const ownPackages = category.packages ?? [];
  const children = getChildCategories(category, categories).filter(
    (child) => (child.packages ?? []).length > 0
  );
  const hasPackages = ownPackages.length > 0 || children.length > 0;

  return (
    <StoreShell>
      <PageContainer>
        <nav className="text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>{category.name}</span>
        </nav>
        <PageHeader
          title={category.name}
          eyebrow="Shop"
          description={
            category.description ? excerpt(category.description, 220) : undefined
          }
        />
        {hasPackages ? (
          <div className="space-y-10">
            <PackageGrid packages={ownPackages} />
            {children.map((child) => (
              <section key={child.id} className="space-y-4">
                <h2 className="lscnr-heading text-xl text-foreground">{child.name}</h2>
                <PackageGrid packages={child.packages ?? []} />
              </section>
            ))}
          </div>
        ) : (
          <EmptyState title="No packages in this category" />
        )}
      </PageContainer>
    </StoreShell>
  );
}
