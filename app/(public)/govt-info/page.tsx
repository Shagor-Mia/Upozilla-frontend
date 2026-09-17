import type { Metadata } from "next";

import { PageHero } from "@/components/layout/PageHero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import { getTranslations } from "next-intl/server";
import type { GovtOffice } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("govtInfoPage"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/govt-info" },
  };
}

export default async function GovtInfoPage() {
  const [t, tCategory, offices] = await Promise.all([
    getTranslations("govtInfoPage"),
    getTranslations("govtInfoPage.category"),
    apiGet<GovtOffice[]>("/govt-offices", { revalidateSeconds: 300 }),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />

      {offices.length === 0 ? (
        <p className="mt-8 text-body-md text-on-surface-variant">{t("emptyState")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {offices.map((office) => (
            <Card key={office.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-headline-md">{office.name}</CardTitle>
                <Badge variant="secondary" className="w-fit">
                  {tCategory(office.category)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-1 text-body-md text-on-surface-variant">
                {office.address && <p>{office.address}</p>}
                {office.phone && <p>{t("phoneLabel", { phone: office.phone })}</p>}
                {office.email && <p>{t("emailLabel", { email: office.email })}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
