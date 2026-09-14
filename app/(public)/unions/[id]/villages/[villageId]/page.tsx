import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Location, Paginated, Place, Representative } from "@/types/api";

const POSITION_LABEL: Record<string, string> = {
  chairman: "চেয়ারম্যান",
  women_member: "সংরক্ষিত মহিলা সদস্য",
  ward_member: "ওয়ার্ড সদস্য",
};

async function getVillage(unionId: string, villageId: string): Promise<Location | null> {
  const villages = await apiGet<Location[]>("/locations", {
    revalidateSeconds: 3600,
    searchParams: { type: "village", parent_id: unionId },
  });
  return villages.find((v) => v.id === villageId) ?? null;
}

export async function generateMetadata(
  props: PageProps<"/unions/[id]/villages/[villageId]">
): Promise<Metadata> {
  const { id, villageId } = await props.params;
  const [village, { site_name }] = await Promise.all([getVillage(id, villageId), getPublicSettings()]);
  if (!village) return {};
  return { title: village.name, description: `${village.name} — ${site_name}` };
}

export default async function VillageDetailPage(props: PageProps<"/unions/[id]/villages/[villageId]">) {
  const { id, villageId } = await props.params;
  const village = await getVillage(id, villageId);
  if (!village) notFound();

  const [places, representatives] = await Promise.all([
    apiGet<Paginated<Place>>("/places", {
      revalidateSeconds: 300,
      searchParams: { location_id: villageId, page_size: "60" },
    }),
    apiGet<Paginated<Representative>>("/representatives", {
      revalidateSeconds: 300,
      searchParams: { location_id: villageId },
    }),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <Link href={`/unions/${id}`} className="text-label-sm text-primary hover:underline">
        ← ইউনিয়নে ফিরে যান
      </Link>
      <h1 className="mt-2 text-headline-lg text-on-surface">{village.name}</h1>

      {representatives.items.length > 0 && (
        <div className="mt-6">
          <h2 className="text-headline-md text-on-surface">ওয়ার্ড প্রতিনিধি</h2>
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

      <div className="mt-8">
        <h2 className="text-headline-md text-on-surface">জনপ্রিয় জায়গা</h2>
        {places.items.length === 0 ? (
          <p className="mt-4 text-body-md text-on-surface-variant">এই গ্রামে এখনও কোনো জায়গা যুক্ত করা হয়নি।</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.items.map((place) => (
              <Link key={place.id} href={`/places/${place.slug}`}>
                <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="text-headline-md">{place.name}</CardTitle>
                    <Badge variant="secondary" className="w-fit capitalize">
                      {place.category}
                    </Badge>
                  </CardHeader>
                  {place.description && (
                    <CardContent className="line-clamp-2 text-body-md text-on-surface-variant">
                      {place.description}
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
