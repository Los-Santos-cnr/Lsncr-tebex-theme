import { createContentPage } from "@/components/store/ContentPage";

export const metadata = { title: "Privacy" };

export default createContentPage({
  file: "privacy.md",
  title: "Privacy Policy",
  eyebrow: "Legal",
  description: "What data this store uses, and what stays with Tebex.",
});
