"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/cn";

export function FaqAccordion({
  items,
  className,
}: {
  items: { question: string; answer: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={item.question}
            className={cn(
              "lscnr-card overflow-hidden rounded-md",
              isOpen && "border-cop/40"
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-sm font-extrabold tabular-nums text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 font-display text-sm font-bold uppercase tracking-wide text-foreground">
                {item.question}
              </span>
              <Plus
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-45 text-gold"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-200 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 pl-[3.25rem] text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
