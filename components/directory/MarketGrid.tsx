"use client";

import Link from "next/link";

import { DirectoryList } from "@/components/directory/DirectoryList";
import { DistanceChip } from "@/components/directory/DistanceChip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Market } from "@/types/api";

export function MarketGrid({ markets }: { markets: Market[] }) {
  return (
    <DirectoryList
      entity="markets"
      initialItems={markets}
      renderItem={(market) => (
        <Link href={`/markets/${market.id}`}>
          <Card className="h-full shadow-card transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-headline-md">{market.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">
                  {market.type}
                </Badge>
                {market.distance_km != null && <DistanceChip km={market.distance_km} />}
              </div>
            </CardHeader>
            <CardContent className="text-body-md text-on-surface-variant">
              <p>{market.market_day?.join(", ") ?? "Schedule TBA"}</p>
              {market.start_time && market.end_time && (
                <p>
                  {market.start_time} – {market.end_time}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      )}
    />
  );
}
