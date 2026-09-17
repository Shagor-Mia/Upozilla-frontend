import { Phone } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { AmbulanceHospital } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("ambulancePage"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/hospitals/ambulance" },
  };
}

export default async function AmbulancePage() {
  const [t, hospitals] = await Promise.all([
    getTranslations("ambulancePage"),
    apiGet<AmbulanceHospital[]>("/hospitals/ambulance"),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />

      {hospitals.length === 0 ? (
        <p className="text-body-md mt-8 text-on-surface-variant">{t("empty")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((hospital) => (
            <Card key={hospital.id} className="shadow-card">
              <CardContent className="pt-6">
                <h2 className="text-headline-md text-on-surface">{hospital.name}</h2>
                {hospital.address && <p className="text-body-md mt-1 text-on-surface-variant">{hospital.address}</p>}
                <a
                  href={`tel:${hospital.ambulance_contact}`}
                  className="text-label-lg mt-4 flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-on-primary transition-opacity hover:opacity-90"
                >
                  <Phone size={18} />
                  {hospital.ambulance_contact}
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
