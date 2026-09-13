"use client";

import { Fragment, type ReactNode } from "react";

import { NearMeToggle } from "@/components/directory/NearMeToggle";
import { Button } from "@/components/ui/button";
import { type DirectoryEntity, useNearMe } from "@/lib/use-near-me";
import { cn } from "@/lib/utils";

interface DirectoryItem {
  id: string;
  distance_km: number | null;
}

interface DirectoryListProps<T extends DirectoryItem> {
  entity: DirectoryEntity;
  /** Server-rendered list; shown until the visitor opts into "near me". */
  initialItems: T[];
  renderItem: (item: T) => ReactNode;
  emptyMessage?: string;
}

/**
 * Card grid for the public directories. Renders the SSR items on first paint
 * (SEO/ISR unchanged) and swaps them for browser-fetched near-me results when
 * the visitor shares their location. Server pages can't pass `renderItem`
 * across the client boundary, so each directory wraps this in its own small
 * client grid (HospitalGrid, MarketGrid, ...).
 */
export function DirectoryList<T extends DirectoryItem>({
  entity,
  initialItems,
  renderItem,
  emptyMessage = "Nothing published here yet.",
}: DirectoryListProps<T>) {
  const nearMe = useNearMe<T>(entity);
  const showingNearMe = nearMe.items !== null;
  const items = nearMe.items ?? initialItems;
  const loading = nearMe.status === "loading";

  return (
    <div className="mt-8 space-y-6">
      <NearMeToggle
        status={nearMe.status}
        radius={nearMe.radius}
        error={nearMe.error}
        onActivate={nearMe.activate}
        onRadiusChange={nearMe.setRadius}
        onReset={nearMe.reset}
      />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
          <p className="text-body-md text-on-surface-variant">
            {showingNearMe ? `Nothing within ${nearMe.radius} km of you.` : emptyMessage}
          </p>
          {showingNearMe && nearMe.radius !== 25 && (
            <Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => nearMe.setRadius(25)}>
              Widen to 25 km
            </Button>
          )}
        </div>
      ) : (
        <div
          aria-busy={loading}
          className={cn(
            "grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3",
            loading && "opacity-60"
          )}
        >
          {items.map((item) => (
            <Fragment key={item.id}>{renderItem(item)}</Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
