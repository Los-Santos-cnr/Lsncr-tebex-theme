import { ApiErrorNotice, ApiNotConfiguredNotice } from "@/components/admin/ApiNotice";
import { BansClient } from "@/components/admin/BansClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { isAdminApiConfigured, listBans, type TebexBan } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bans", robots: { index: false } };

export default async function BansPage() {
  const configured = isAdminApiConfigured();
  let bans: TebexBan[] = [];
  let error: string | null = null;

  if (configured) {
    try {
      const res = await listBans();
      bans = res.data ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load bans";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bans"
        eyebrow="Moderation"
        description="Block players or IP addresses from purchasing on the store."
      />
      {!configured ? (
        <ApiNotConfiguredNotice />
      ) : error ? (
        <ApiErrorNotice message={error} />
      ) : (
        <BansClient initialBans={bans} />
      )}
    </div>
  );
}
