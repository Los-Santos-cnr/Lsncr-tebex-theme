import { notFound } from "next/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { PackageDetailClient } from "@/components/store/PackageDetailClient";
import { PageContainer } from "@/components/ui/PageHeader";
import { getAllPackages, getPackageById, isTebexConfigured } from "@/lib/tebex";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = isTebexConfigured()
    ? await getPackageById(id).catch(() => null)
    : null;
  return { title: pkg?.name ?? "Package" };
}

export default async function PackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isTebexConfigured()) notFound();

  const pkg = await getPackageById(id).catch(() => null);
  if (!pkg) notFound();

  const allPackages = await getAllPackages().catch(() => []);
  const related = allPackages
    .filter((p) => p.category.id === pkg.category.id && p.id !== pkg.id)
    .slice(0, 4);

  return (
    <StoreShell>
      <PageContainer>
        <PackageDetailClient pkg={pkg} related={related} />
      </PageContainer>
    </StoreShell>
  );
}
