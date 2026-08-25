import { redirect } from "next/navigation";
import { categoryHref, getCategories, getTopCategories, isTebexConfigured } from "@/lib/tebex";

export default async function StorePage() {
  if (!isTebexConfigured()) {
    redirect("/");
  }

  const categories = await getCategories(false).catch(() => []);
  const firstCategory = getTopCategories(categories)[0];

  redirect(firstCategory ? categoryHref(firstCategory) : "/");
}
