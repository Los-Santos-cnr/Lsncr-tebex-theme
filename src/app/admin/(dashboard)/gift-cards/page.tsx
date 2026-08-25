import { ApiErrorNotice, ApiNotConfiguredNotice } from "@/components/admin/ApiNotice";
import { GiftCardsClient } from "@/components/admin/GiftCardsClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { isAdminApiConfigured, listGiftCards, type TebexGiftCard } from "@/lib/tebex-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gift cards", robots: { index: false } };

export default async function GiftCardsPage() {
  const configured = isAdminApiConfigured();
  let cards: TebexGiftCard[] = [];
  let error: string | null = null;

  if (configured) {
    try {
      const res = await listGiftCards();
      cards = res.data ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load gift cards";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gift cards"
        eyebrow="Store credit"
        description="Issue store credit, top up existing balances, or void cards."
      />
      {!configured ? (
        <ApiNotConfiguredNotice />
      ) : error ? (
        <ApiErrorNotice message={error} />
      ) : (
        <GiftCardsClient initialCards={cards} />
      )}
    </div>
  );
}
