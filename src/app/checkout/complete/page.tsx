import Link from "next/link";
import { StoreShell } from "@/components/layout/StoreShell";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { getBasket, isTebexConfigured } from "@/lib/tebex";
import { formatPrice } from "@/lib/format";
import { getDiscordInvite } from "@/lib/site";

export const metadata = { title: "Thank you" };

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ basket?: string }>;
}) {
  const { basket: basketIdent } = await searchParams;
  const discord = getDiscordInvite();

  let summary: { total: number; currency: string; items: string[] } | null = null;

  if (basketIdent && isTebexConfigured()) {
    try {
      const basket = await getBasket(basketIdent);
      summary = {
        total: basket.total_price,
        currency: basket.currency,
        items: (basket.packages ?? [])
          .map((p) => p.package?.name)
          .filter(Boolean) as string[],
      };
    } catch {
      summary = null;
    }
  }

  return (
    <StoreShell>
      <PageContainer>
        <PageHeader
          title="Thank you for your purchase"
          description="Your order is being processed by Tebex."
        />
        <Card className="mx-auto max-w-lg rounded-xl">
          <CardBody className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Packages are delivered to your linked CFX account. It may take a moment after
              payment completes.
            </p>
            {summary ? (
              <div className="rounded-lg border border-border bg-surface-2 p-4 text-left text-sm">
                <p className="font-semibold">Order summary</p>
                <ul className="mt-2 list-inside list-disc text-muted-foreground">
                  {summary.items.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold text-primary">
                  {formatPrice(summary.total, summary.currency)}
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/">
                <Button variant="primary">Return home</Button>
              </Link>
              <Link href="/account">
                <Button variant="outline">View account</Button>
              </Link>
              {discord ? (
                <Link href={discord} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost">Join Discord</Button>
                </Link>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </PageContainer>
    </StoreShell>
  );
}
