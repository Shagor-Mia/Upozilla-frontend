import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SchoolGrid } from "@/components/directory/SchoolGrid";
import { PageHero } from "@/components/layout/PageHero";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Paginated, School } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("schoolsList"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/schools" },
  };
}

export default async function SchoolsPage() {
  const t = await getTranslations("schoolsList");
  // ISR-cached default list; SchoolGrid swaps in browser-fetched "near me"
  // results when the visitor opts in, without losing the server-rendered markup.
  const { items: schools } = await apiGet<Paginated<School>>("/schools");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      <SchoolGrid schools={schools} />
    </div>
  );
}
