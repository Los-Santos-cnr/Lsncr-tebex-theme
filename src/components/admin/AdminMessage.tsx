import { cn } from "@/components/ui/cn";

export function AdminMessage({
  message,
}: {
  message: { type: "success" | "error"; text: string } | null;
}) {
  if (!message) return null;
  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        message.type === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-danger/30 bg-danger/10 text-danger"
      )}
    >
      {message.text}
    </p>
  );
}
