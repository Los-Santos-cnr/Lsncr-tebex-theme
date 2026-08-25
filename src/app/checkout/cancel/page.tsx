import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata = { title: "Checkout cancelled" };

export default function CheckoutCancelPage() {
  return (
    <StoreShell>
      <PageContainer>
        <PageHeader
          title="Checkout cancelled"
          description="Your cart has been preserved. You can continue when ready."
        />
        <Card className="mx-auto max-w-lg rounded-xl">
          <CardBody className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              No payment was taken. Return to your cart to try again.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/cart">
                <Button variant="primary">Back to cart</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Continue shopping</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </PageContainer>
    </StoreShell>
  );
}
