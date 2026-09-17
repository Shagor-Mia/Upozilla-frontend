"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ListingImage } from "@/components/listings/ListingImage";
import { StatusChip } from "@/components/listings/StatusChip";
import { Button } from "@/components/ui/button";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { formatRelativeTime } from "@/lib/format";
import type { Place } from "@/types/api";

/** Mirrors MyListings.tsx for the marketplace/exchange case, but places have
 * no price/status transitions (sold/relist) - just a read-only moderation
 * status while an admin reviews the submission. */
export function MyPlaces() {
  const t = useTranslations("myPlaces");
  const tCategory = useTranslations("placesList.category");
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientApi
      .get<Place[]>("places/mine")
      .then(setPlaces)
      .catch((err) => setError(err instanceof ClientApiError ? err.message : "Could not load your places"));
  }, []);

  if (error && !places) return <p className="text-body-md text-error">{error}</p>;
  if (!places) return <div className="h-40 animate-pulse rounded-xl bg-surface-container" aria-hidden="true" />;

  if (places.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        <p className="text-body-md text-on-surface-variant">{t("empty")}</p>
        <Button render={<Link href="/sell/place" />} nativeButton={false} className="mt-4">
          {t("addFirst")}
        </Button>
      </div>
    );
  }

  const moderationLabel = (status: string) =>
    status === "approved" ? t("moderationApproved") : status === "rejected" ? t("moderationRejected") : t("moderationPending");

  return (
    <div className="space-y-3">
      {places.map((place) => (
        <div
          key={place.id}
          className="flex flex-col gap-4 rounded-xl border border-border-muted bg-surface-container-lowest p-4 shadow-card sm:flex-row sm:items-center"
        >
          <ListingImage src={place.cover_image ?? undefined} alt="" sizes="96px" className="w-full sm:w-28" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={place.moderation_status} label={moderationLabel(place.moderation_status)} />
              <span className="text-metadata text-on-surface-variant">{tCategory(place.category)}</span>
            </div>
            <p className="text-body-md mt-1 truncate font-semibold text-on-surface">{place.name}</p>
            <p className="text-metadata mt-1 text-on-surface-variant">{formatRelativeTime(place.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
