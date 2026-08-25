import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { HOME_FAQ } from "@/lib/site";
import { FaqAccordion } from "./FaqAccordion";
import { SectionLabel } from "./SectionLabel";

export function FaqTeaser({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col items-center gap-2 text-center">
        <SectionLabel eyebrow="Help Center" title="Frequently Asked Questions" align="center" />
      </div>
      <div className="mx-auto max-w-3xl">
        <FaqAccordion items={HOME_FAQ} />
        <p className="mt-5 text-center text-sm text-muted-foreground">
          Still stuck?{" "}
          <Link href="/support" className="font-medium text-gold hover:underline">
            Open a support ticket
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
