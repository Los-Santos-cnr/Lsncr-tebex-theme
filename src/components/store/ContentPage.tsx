import { notFound } from "next/navigation";
import { StoreShell } from "@/components/layout/StoreShell";
import { MarkdownContent } from "@/components/store/MarkdownContent";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { getMarkdownContent } from "@/lib/content";

export function createContentPage({
  file,
  title,
  eyebrow = "Information",
  description,
}: {
  file: string;
  title: string;
  eyebrow?: string;
  description?: string;
}) {
  return async function ContentRoutePage() {
    const content = await getMarkdownContent(file);
    if (!content) notFound();

    return (
      <StoreShell>
        <PageContainer className="py-12 sm:py-16 lg:py-20">
          <article className="lscnr-doc mx-auto w-full max-w-3xl rounded-lg px-5 py-8 sm:px-10 sm:py-12">
            <PageHeader title={title} eyebrow={eyebrow} description={description} />
            <MarkdownContent content={content} className="mt-8" />
          </article>
        </PageContainer>
      </StoreShell>
    );
  };
}
