import { type ReactNode } from "react";
import { cn } from "./cn";

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  eyebrow,
  description,
  icon,
  actions,
  className,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-surface-2">
            {icon}
          </div>
        ) : null}
        <div>
          {eyebrow ? <p className="lscnr-eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="lscnr-heading text-2xl text-foreground sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
          <div className="mt-5 h-px w-20 bg-gold" />
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
