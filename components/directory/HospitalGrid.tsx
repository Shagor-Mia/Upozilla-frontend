"use client";

import Link from "next/link";

import { DirectoryList } from "@/components/directory/DirectoryList";
import { DistanceChip } from "@/components/directory/DistanceChip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Hospital } from "@/types/api";

export function HospitalGrid({ hospitals }: { hospitals: Hospital[] }) {
  return (
    <DirectoryList
      entity="hospitals"
      initialItems={hospitals}
      renderItem={(hospital) => (
        <Link href={`/hospitals/${hospital.id}`}>
          <Card className="h-full shadow-card transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-headline-md">{hospital.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="uppercase">
                  {hospital.type}
                </Badge>
                {hospital.distance_km != null && <DistanceChip km={hospital.distance_km} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-body-md text-on-surface-variant">
              {hospital.address && <p>{hospital.address}</p>}
              {hospital.contact && <p>{hospital.contact}</p>}
            </CardContent>
          </Card>
        </Link>
      )}
    />
  );
}
