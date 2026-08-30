import { createContentPage } from "@/components/store/ContentPage";

export const metadata = { title: "Terms" };

export default createContentPage({
  file: "terms.md",
  title: "Terms of Service",
  eyebrow: "Legal",
  description: "How this store works, what you are buying, and the refund policy.",
});
