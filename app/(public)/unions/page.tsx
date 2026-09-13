import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { Location } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("unionsPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: config.siteName }),
  };
}

async function getUnions(): Promise<Location[]> {
  const upazilas = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "upazila" },
  });
  const upazila = upazilas[0];
  if (!upazila) return [];
  return apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "union", parent_id: upazila.id },
  });
}

export default async function UnionsPage() {
  const [unions, t] = await Promise.all([getUnions(), getTranslations("unionsPage")]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      {unions.length === 0 ? (
        <p className="mt-8 text-body-md text-on-surface-variant">{t("emptyState")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {unions.map((union) => (
            <Link key={union.id} href={`/unions/${union.id}`}>
              <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-headline-md">{union.name}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
