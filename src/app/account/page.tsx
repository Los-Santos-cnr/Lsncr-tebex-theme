import { StoreShell } from "@/components/layout/StoreShell";
import { AccountPageClient } from "@/components/store/AccountPageClient";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Account",
};

export default function AccountPage() {
  return (
    <StoreShell>
      <PageContainer>
        <PageHeader
          title="Your account"
          eyebrow="Linked identity"
          description="Your linked CFX identity for checkout and delivery."
        />
        <AccountPageClient />
      </PageContainer>
    </StoreShell>
  );
}
