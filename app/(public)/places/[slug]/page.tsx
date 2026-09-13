import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MapView } from "@/components/map/MapView";
import { Badge } from "@/components/ui/badge";
import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { Place } from "@/types/api";

async function getPlace(slug: string): Promise<Place | null> {
  try {
    return await apiGet<Place>(`/places/${slug}`);
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata(
  props: PageProps<"/places/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const place = await getPlace(slug);
  if (!place) return {};

  const description = place.description ?? `${place.name} — ${config.siteName}`;

  return {
    title: place.name,
    description,
    alternates: { canonical: `/places/${place.slug}` },
    openGraph: {
      title: place.name,
      description,
      type: "website",
      images: place.cover_image ? [place.cover_image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: place.name,
      description,
    },
  };
}

export default async function PlaceDetailPage(props: PageProps<"/places/[slug]">) {
  const { slug } = await props.params;
  const place = await getPlace(slug);
  if (!place) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": place.category === "tourist" ? "TouristAttraction" : "Place",
    name: place.name,
    description: place.description ?? undefined,
    image: place.cover_image ?? undefined,
    geo:
      place.latitude != null && place.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: place.latitude,
            longitude: place.longitude,
          }
        : undefined,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Badge variant="secondary" className="capitalize">
        {place.category}
      </Badge>
      <h1 className="mt-3 text-display-hero-mobile text-on-surface">{place.name}</h1>
      {place.description && (
        <p className="mt-4 whitespace-pre-line text-body-md text-on-surface-variant">
          {place.description}
        </p>
      )}
      {place.latitude != null && place.longitude != null && (
        <MapView
          latitude={place.latitude}
          longitude={place.longitude}
          label={place.name}
          className="mt-6"
        />
      )}
    </article>
  );
}
