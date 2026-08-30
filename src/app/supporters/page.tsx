import { StoreShell } from "@/components/layout/StoreShell";
import { SupportersBoard } from "@/components/store/SupportersBoard";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { getTopSupporters, TOP_SUPPORTERS_LIMIT } from "@/lib/supporters";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Top Supporters",
  description: "Thank you to the players who support Los Santos Cops and Robbers.",
};

export default async function SupportersPage() {
  const supporters = await getTopSupporters();

  return (
    <StoreShell>
      <PageContainer className="py-12 sm:py-16">
        <PageHeader
          title="Top Supporters"
          eyebrow="Hall of fame"
          description="Thank you. Every membership, token, and gift helps keep Los Santos Cops and Robbers running. These are the players who have given the most. Names only, ranked with respect."
        />
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Up to {TOP_SUPPORTERS_LIMIT} supporters, sorted by who has given the most. Amounts stay private.
        </p>
        <SupportersBoard supporters={supporters} />
      </PageContainer>
    </StoreShell>
  );
}
