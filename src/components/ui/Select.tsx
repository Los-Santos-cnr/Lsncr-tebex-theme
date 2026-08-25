import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "./cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-elevated px-3 text-sm text-foreground focus-ring",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
});
