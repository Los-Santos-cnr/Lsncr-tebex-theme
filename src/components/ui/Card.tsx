import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "./cn";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn("rounded-md border border-border bg-surface", className)}
        {...rest}
      />
    );
  }
);

export const CardHeader = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-b border-border px-4 py-3", className)} {...rest} />
);

export const CardTitle = ({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-sm font-semibold", className)} {...rest} />
);

export const CardDescription = ({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-xs text-muted-foreground", className)} {...rest} />
);

export const CardBody = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-4", className)} {...rest} />
);

export const CardFooter = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("border-t border-border bg-surface-2 px-4 py-3", className)} {...rest} />
);
