import { cn } from "@/components/ui/cn";

export function SectionLabel({
  eyebrow,
  title,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 className="lscnr-heading text-2xl text-foreground sm:text-[1.85rem]">{title}</h2>
    </div>
  );
}
