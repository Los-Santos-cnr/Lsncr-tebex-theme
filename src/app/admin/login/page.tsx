import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { CardBody } from "@/components/ui/Card";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin-auth";
import { SITE_BRAND } from "@/lib/site";

export const metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const configured = isAdminConfigured();
  if (configured && (await isAdminAuthenticated())) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-border/50 lscnr-logo-badge font-display text-xl font-extrabold">
            L
          </span>
          <h1 className="lscnr-heading text-xl">
            {SITE_BRAND} Admin
          </h1>
          <p className="text-xs text-muted-foreground">Restricted access — staff only.</p>
        </div>

        <div className="lscnr-panel rounded-md">
          <CardBody className="p-6">
            {configured ? (
              <AdminLoginForm />
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Admin panel is disabled.</p>
                <p>
                  Set the <code className="text-gold">ADMIN_PASSWORD</code> environment variable
                  (and <code className="text-gold">TEBEX_SECRET_KEY</code> for API access) to enable
                  the admin panel.
                </p>
              </div>
            )}
          </CardBody>
        </div>
      </div>
    </div>
  );
}
