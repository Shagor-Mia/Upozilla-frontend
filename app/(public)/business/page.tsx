import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BusinessGrid } from "@/components/directory/BusinessGrid";
import { PageHero } from "@/components/layout/PageHero";
import { apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { Business } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("businessPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: config.siteName }),
  };
}

export default async function BusinessPage() {
  const [businesses, t] = await Promise.all([apiGet<Business[]>("/businesses"), getTranslations("businessPage")]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      <BusinessGrid businesses={businesses} />
    </div>
  );
}
