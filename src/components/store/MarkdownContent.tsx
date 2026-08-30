import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/components/ui/cn";

export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div className={cn("lscnr-prose max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: () => null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
