import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { HospitalGrid } from "@/components/directory/HospitalGrid";
import { PageHero } from "@/components/layout/PageHero";
import { apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { Hospital, Paginated } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hospitalsList");
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: config.siteName }),
  };
}

export default async function HospitalsPage() {
  const t = await getTranslations("hospitalsList");
  // ISR-cached default list; HospitalGrid swaps in browser-fetched "near me"
  // results when the visitor opts in, without losing the server-rendered markup.
  const { items: hospitals } = await apiGet<Paginated<Hospital>>("/hospitals");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      <HospitalGrid hospitals={hospitals} />
    </div>
  );
}
