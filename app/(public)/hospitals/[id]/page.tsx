import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LazyMapView } from "@/components/map/LazyMapView";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Doctor, Hospital } from "@/types/api";

async function getHospital(id: string): Promise<Hospital | null> {
  try {
    return await apiGet<Hospital>(`/hospitals/${id}`);
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata(
  props: PageProps<"/hospitals/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const [hospital, { site_name }] = await Promise.all([getHospital(id), getPublicSettings()]);
  if (!hospital) return {};

  return {
    title: hospital.name,
    description: `${hospital.name} — ${site_name}`,
    alternates: { canonical: `/hospitals/${hospital.id}` },
  };
}

export default async function HospitalDetailPage(props: PageProps<"/hospitals/[id]">) {
  const { id } = await props.params;
  const hospital = await getHospital(id);
  if (!hospital) notFound();

  const t = await getTranslations("hospitalDetail");
  const doctors = await apiGet<Doctor[]>(`/hospitals/${id}/doctors`);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: hospital.name,
    telephone: hospital.contact ?? undefined,
    address: hospital.address ?? undefined,
    geo:
      hospital.latitude != null && hospital.longitude != null
        ? { "@type": "GeoCoordinates", latitude: hospital.latitude, longitude: hospital.longitude }
        : undefined,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Badge variant="secondary" className="uppercase">
        {hospital.type}
      </Badge>
      <h1 className="mt-3 text-display-hero-mobile text-on-surface">{hospital.name}</h1>
      <div className="mt-4 space-y-1 text-body-md text-on-surface-variant">
        {hospital.address && <p>{hospital.address}</p>}
        {hospital.contact && <p>{hospital.contact}</p>}
      </div>

      {hospital.latitude != null && hospital.longitude != null && (
        <LazyMapView
          latitude={hospital.latitude}
          longitude={hospital.longitude}
          label={hospital.name}
          className="mt-6"
        />
      )}

      {doctors.length > 0 && (
        <div className="mt-8">
          <h2 className="text-headline-md text-on-surface">{t("doctors")}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-headline-md">{doctor.name}</CardTitle>
                  {doctor.specialty && (
                    <Badge variant="secondary" className="w-fit">
                      {doctor.specialty}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 text-body-md text-on-surface-variant">
                  {doctor.chamber_days && (
                    <p>{t("doctorDays", { days: doctor.chamber_days.join(", ") })}</p>
                  )}
                  {doctor.chamber_hours && <p>{t("doctorHours", { hours: doctor.chamber_hours })}</p>}
                  {doctor.contact && <p>{t("doctorContact", { contact: doctor.contact })}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
