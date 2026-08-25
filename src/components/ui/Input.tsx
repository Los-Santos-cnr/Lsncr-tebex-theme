import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-elevated px-3 text-sm text-foreground placeholder:text-subtle-foreground focus-ring",
        className
      )}
      {...rest}
    />
  );
});

export function FieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
