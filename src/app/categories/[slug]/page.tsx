import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { PackageCard } from "@/components/store/PackageCard";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/Section";
import { getCategoryBySlug, isTebexConfigured } from "@/lib/tebex";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = isTebexConfigured()
    ? await getCategoryBySlug(slug).catch(() => null)
    : null;
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

  const category = await getCategoryBySlug(slug).catch(() => null);
  if (!category) notFound();

  const packages = category.packages ?? [];

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
          description={category.description || undefined}
        />
        {packages.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} variant="grid" />
            ))}
          </div>
        ) : (
          <EmptyState title="No packages in this category" />
        )}
      </PageContainer>
    </StoreShell>
  );
}
