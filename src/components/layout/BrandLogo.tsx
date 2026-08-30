import Image from "next/image";
import { cn } from "@/components/ui/cn";

export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt="LSCNR"
      width={160}
      height={160}
      priority={priority}
      className={cn("h-10 w-auto object-contain", className)}
    />
  );
}
