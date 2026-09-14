import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Paginated, Service } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("servicesList"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/services" },
  };
}

export default async function ServicesPage() {
  const t = await getTranslations("servicesList");
  const { items: services } = await apiGet<Paginated<Service>>("/services");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero
        title={t("title")}
        description={t("description")}
      />

      {services.length === 0 ? (
        <p className="mt-8 text-body-md text-on-surface-variant">{t("emptyState")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-headline-md">{service.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-body-md text-on-surface-variant">
                {service.description && <p>{service.description}</p>}
                {service.fee != null && <p>{t("fee", { fee: service.fee })}</p>}
                {service.office_name && <p>{t("office", { office: service.office_name })}</p>}
                {service.office_contact && <p>{t("contact", { contact: service.office_contact })}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
