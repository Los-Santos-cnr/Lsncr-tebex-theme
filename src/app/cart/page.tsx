import { StoreShell } from "@/components/layout/StoreShell";
import { CartPageClient } from "@/components/store/CartPageClient";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <StoreShell>
      <PageContainer>
        <PageHeader
          title="Your cart"
          eyebrow="Checkout"
          description="Review what you're picking up before Tebex checkout."
        />
        <CartPageClient />
      </PageContainer>
    </StoreShell>
  );
}
