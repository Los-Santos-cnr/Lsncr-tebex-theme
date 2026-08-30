import { StoreShell } from "@/components/layout/StoreShell";
import { LoginPageClient } from "@/components/store/LoginPageClient";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <StoreShell>
      <PageContainer>
        <PageHeader
          title="Link your FiveM account"
          eyebrow="CFX · FiveM"
          description="Connect your FiveM account so purchases are delivered to the right player."
        />
        <LoginPageClient />
      </PageContainer>
    </StoreShell>
  );
}
