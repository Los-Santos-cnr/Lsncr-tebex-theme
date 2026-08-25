import { notFound } from "next/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { MarkdownContent } from "@/components/store/MarkdownContent";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { getMarkdownContent } from "@/lib/content";

export function createContentPage(file: string, title: string, description?: string) {
  return async function ContentRoutePage() {
    const content = await getMarkdownContent(file);
    if (!content) notFound();

    return (
      <StoreShell>
        <PageContainer>
          <PageHeader title={title} description={description} />
          <MarkdownContent content={content} />
        </PageContainer>
      </StoreShell>
    );
  };
}
