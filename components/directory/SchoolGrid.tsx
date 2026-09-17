"use client";

import Link from "next/link";

import { DirectoryList } from "@/components/directory/DirectoryList";
import { DistanceChip } from "@/components/directory/DistanceChip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { School } from "@/types/api";

export function SchoolGrid({ schools }: { schools: School[] }) {
  return (
    <DirectoryList
      entity="schools"
      initialItems={schools}
      renderItem={(school) => (
        <Link href={`/schools/${school.id}`}>
          <Card className="h-full shadow-card transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-headline-md">{school.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="uppercase">
                  {school.type}
                </Badge>
                {school.distance_km != null && <DistanceChip km={school.distance_km} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-1 text-body-md text-on-surface-variant">
              {school.address && <p>{school.address}</p>}
              {school.contact && <p>{school.contact}</p>}
            </CardContent>
          </Card>
        </Link>
      )}
    />
  );
}
