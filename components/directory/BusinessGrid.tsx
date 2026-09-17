"use client";

import Link from "next/link";

import { DirectoryList } from "@/components/directory/DirectoryList";
import { DistanceChip } from "@/components/directory/DistanceChip";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { Business } from "@/types/api";

export function BusinessGrid({ businesses }: { businesses: Business[] }) {
  return (
    <DirectoryList
      entity="businesses"
      initialItems={businesses}
      renderItem={(business) => (
        <Link href={`/popular-services/${business.slug}`}>
          <Card className="h-full shadow-card transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-headline-md">
                {business.name}
                {business.is_verified && <VerifiedBadge label="Verified" />}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {business.category}
                </Badge>
                {business.distance_km != null && <DistanceChip km={business.distance_km} />}
              </div>
            </CardHeader>
          </Card>
        </Link>
      )}
    />
  );
}
