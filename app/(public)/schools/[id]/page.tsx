import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LazyMapView } from "@/components/map/LazyMapView";
import { Badge } from "@/components/ui/badge";
import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { School } from "@/types/api";

async function getSchool(id: string): Promise<School | null> {
  try {
    return await apiGet<School>(`/schools/${id}`);
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata(
  props: PageProps<"/schools/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const [school, { site_name }] = await Promise.all([getSchool(id), getPublicSettings()]);
  if (!school) return {};

  return {
    title: school.name,
    description: `${school.name} — ${site_name}`,
    alternates: { canonical: `/schools/${school.id}` },
  };
}

export default async function SchoolDetailPage(props: PageProps<"/schools/[id]">) {
  const { id } = await props.params;
  const school = await getSchool(id);
  if (!school) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    name: school.name,
    telephone: school.contact ?? undefined,
    address: school.address ?? undefined,
    geo:
      school.latitude != null && school.longitude != null
        ? { "@type": "GeoCoordinates", latitude: school.latitude, longitude: school.longitude }
        : undefined,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Badge variant="secondary" className="uppercase">
        {school.type}
      </Badge>
      <h1 className="mt-3 text-display-hero-mobile text-on-surface">{school.name}</h1>
      <div className="mt-4 space-y-1 text-body-md text-on-surface-variant">
        {school.address && <p>{school.address}</p>}
        {school.contact && <p>{school.contact}</p>}
      </div>

      {school.latitude != null && school.longitude != null && (
        <LazyMapView
          latitude={school.latitude}
          longitude={school.longitude}
          label={school.name}
          className="mt-6"
        />
      )}
    </article>
  );
}
