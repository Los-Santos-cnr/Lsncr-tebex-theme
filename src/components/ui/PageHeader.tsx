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
        "mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6",
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
        "flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="flex gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-cop/30 bg-gold/10">
            {icon}
          </div>
        ) : null}
        <div>
          {eyebrow ? <p className="lscnr-eyebrow mb-1">{eyebrow}</p> : null}
          <h1 className="lscnr-heading text-2xl text-foreground sm:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
