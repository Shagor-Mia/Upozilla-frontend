import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Location, Paginated, Place, Representative, Service } from "@/types/api";

const POSITION_LABEL: Record<string, string> = {
  chairman: "চেয়ারম্যান",
  women_member: "সংরক্ষিত মহিলা সদস্য",
  ward_member: "ওয়ার্ড সদস্য",
};

// There's no GET /locations/{id} detail endpoint - the union's own name comes
// from the small upazila -> unions listing (same two-call shape as
// frontend/lib/locations.ts's getLocationOptions), not a dedicated fetch.
async function getUnion(id: string): Promise<Location | null> {
  const upazilas = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "upazila" },
  });
  const upazila = upazilas[0];
  if (!upazila) return null;
  const unions = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "union", parent_id: upazila.id },
  });
  return unions.find((u) => u.id === id) ?? null;
}

export async function generateMetadata(props: PageProps<"/unions/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [union, { site_name }] = await Promise.all([getUnion(id), getPublicSettings()]);
  if (!union) return {};
  return { title: union.name, description: `${union.name} — ${site_name}` };
}

export default async function UnionDetailPage(props: PageProps<"/unions/[id]">) {
  const { id } = await props.params;
  const union = await getUnion(id);
  if (!union) notFound();

  const [villages, representatives, services, places] = await Promise.all([
    apiGet<Location[]>("/locations", { revalidateSeconds: 3600, searchParams: { type: "village", parent_id: id } }),
    apiGet<Paginated<Representative>>("/representatives", {
      revalidateSeconds: 300,
      searchParams: { location_id: id },
    }),
    apiGet<Paginated<Service>>("/services", { revalidateSeconds: 300, searchParams: { location_id: id } }),
    apiGet<Paginated<Place>>("/places", {
      revalidateSeconds: 300,
      searchParams: { location_id: id, featured_only: "true", page_size: "60" },
    }),
  ]);
  const popularPlaces = places.items.filter((place) => place.category !== "shop");
  const popularShops = places.items.filter((place) => place.category === "shop");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <h1 className="text-headline-lg text-on-surface">{union.name}</h1>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/marketplace?location_id=${id}`}
          className="text-label-sm rounded-full border border-border-muted bg-surface-container-lowest px-4 py-1.5 text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          এই ইউনিয়নের মার্কেটপ্লেস দেখুন
        </Link>
        <Link
          href={`/markets?location_id=${id}`}
          className="text-label-sm rounded-full border border-border-muted bg-surface-container-lowest px-4 py-1.5 text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          এই ইউনিয়নের হাট-বাজার দেখুন
        </Link>
      </div>

      {representatives.items.length > 0 && (
        <div className="mt-6">
          <h2 className="text-headline-md text-on-surface">প্রতিনিধিবৃন্দ</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {representatives.items.map((rep) => (
              <div
                key={rep.id}
                className="rounded-xl border border-border-muted bg-surface-container-lowest p-4 shadow-card"
              >
                <p className="text-body-md font-semibold text-on-surface">{rep.full_name}</p>
                <Badge variant="secondary" className="mt-1 w-fit">
                  {POSITION_LABEL[rep.position] ?? rep.position}
                </Badge>
                {rep.phone && <p className="mt-2 text-body-md text-on-surface-variant">{rep.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {services.items.length > 0 && (
        <div className="mt-8">
          <h2 className="text-headline-md text-on-surface">সেবা</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.items.map((service) => (
              <Card key={service.id} className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-headline-md">{service.name}</CardTitle>
                </CardHeader>
                {(service.office_name || service.office_contact) && (
                  <CardContent className="space-y-1 text-body-md text-on-surface-variant">
                    {service.office_name && <p>{service.office_name}</p>}
                    {service.office_contact && <p>{service.office_contact}</p>}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {popularPlaces.length > 0 && (
        <div className="mt-8">
          <h2 className="text-headline-md text-on-surface">জনপ্রিয় জায়গা</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularPlaces.map((place) => (
              <Link key={place.id} href={`/places/${place.slug}`}>
                <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-headline-md">{place.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {popularShops.length > 0 && (
        <div className="mt-8">
          <h2 className="text-headline-md text-on-surface">জনপ্রিয় দোকান</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {popularShops.map((shop) => (
              <Link key={shop.id} href={`/places/${shop.slug}`}>
                <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-headline-md">{shop.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-headline-md text-on-surface">গ্রামের তালিকা</h2>
        {villages.length === 0 ? (
          <p className="mt-4 text-body-md text-on-surface-variant">এখনও কোনো গ্রাম যুক্ত করা হয়নি।</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {villages.map((village) => (
              <Link key={village.id} href={`/unions/${id}/villages/${village.id}`}>
                <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-headline-md">{village.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
