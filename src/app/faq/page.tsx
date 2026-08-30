import { createContentPage } from "@/components/store/ContentPage";

export const metadata = { title: "FAQ" };

export default createContentPage({
  file: "faq.md",
  title: "Frequently Asked Questions",
  eyebrow: "Help",
  description: "Purchases, delivery, upgrades, and what happens after you pay.",
});
