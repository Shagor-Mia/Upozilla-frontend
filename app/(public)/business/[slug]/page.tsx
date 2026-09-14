import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { LazyMapView } from "@/components/map/LazyMapView";
import { Badge } from "@/components/ui/badge";
import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Business } from "@/types/api";

async function getBusiness(slug: string): Promise<Business | null> {
  try {
    return await apiGet<Business>(`/businesses/${slug}`);
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata(
  props: PageProps<"/business/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const [business, { site_name }] = await Promise.all([getBusiness(slug), getPublicSettings()]);
  if (!business) return {};

  const description = business.description ?? `${business.name} — ${site_name}`;

  return {
    title: business.name,
    description,
    alternates: { canonical: `/business/${business.slug}` },
    openGraph: {
      title: business.name,
      description,
      type: "website",
      images: business.cover_image ? [business.cover_image] : undefined,
    },
  };
}

export default async function BusinessDetailPage(props: PageProps<"/business/[slug]">) {
  const { slug } = await props.params;
  const business = await getBusiness(slug);
  if (!business) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description ?? undefined,
    image: business.cover_image ?? undefined,
    telephone: business.phone ?? undefined,
    address: business.address ?? undefined,
    geo:
      business.latitude != null && business.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: business.latitude,
            longitude: business.longitude,
          }
        : undefined,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {business.category}
        </Badge>
        {business.is_verified && <VerifiedBadge label="Verified business" />}
      </div>
      <h1 className="mt-3 text-display-hero-mobile text-on-surface">{business.name}</h1>
      {business.description && (
        <p className="mt-4 whitespace-pre-line text-body-md text-on-surface-variant">
          {business.description}
        </p>
      )}
      <div className="mt-6 space-y-1 text-body-md text-on-surface-variant">
        {business.phone && <p>Phone: {business.phone}</p>}
        {business.address && <p>Address: {business.address}</p>}
      </div>
      {business.latitude != null && business.longitude != null && (
        <LazyMapView
          latitude={business.latitude}
          longitude={business.longitude}
          label={business.name}
          className="mt-6"
        />
      )}
    </article>
  );
}
