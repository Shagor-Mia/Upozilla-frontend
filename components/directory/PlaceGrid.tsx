"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { DirectoryList } from "@/components/directory/DirectoryList";
import { DistanceChip } from "@/components/directory/DistanceChip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Place } from "@/types/api";

export function PlaceGrid({ places }: { places: Place[] }) {
  const t = useTranslations("placesList.category");
  return (
    <DirectoryList
      entity="places"
      initialItems={places}
      renderItem={(place) => (
        <Link href={`/places/${place.slug}`}>
          <Card className="h-full shadow-card transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-headline-md">{place.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{t(place.category)}</Badge>
                {place.distance_km != null && <DistanceChip km={place.distance_km} />}
              </div>
            </CardHeader>
            {place.description && (
              <CardContent className="text-body-md line-clamp-3 text-on-surface-variant">
                {place.description}
              </CardContent>
            )}
          </Card>
        </Link>
      )}
    />
  );
}
