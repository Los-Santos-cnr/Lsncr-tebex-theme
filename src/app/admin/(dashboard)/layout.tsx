import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminConfigured()) {
    redirect("/admin/login");
  }
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="border-b border-border bg-surface/60 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <Link href="/admin" className="flex items-center gap-3">
            <BrandLogo className="h-9" />
            <span className="text-[11px] text-muted-foreground">Admin</span>
          </Link>
        </div>
        <div className="px-3 pb-4 lg:sticky lg:top-0">
          <AdminNav />
          <Link
            href="/"
            className="mt-3 block rounded-md px-3 py-2 text-xs text-subtle-foreground hover:text-foreground"
          >
            ← Back to store
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  );
}
