"use client";

import { useEffect } from "react";

import { trackEvent } from "@/lib/analytics";
import type { ListingType } from "@/types/api";

/** Fires the Section 16.1 `listing_view` (GA4) / ViewContent (Meta Pixel) event
 * from a client island so the detail page itself stays statically renderable. */
export function ListingViewTracker({
  listingType,
  listingId,
  category,
  value,
  currency,
}: {
  listingType: ListingType;
  listingId: string;
  category: string;
  value: number;
  currency: string;
}) {
  useEffect(() => {
    trackEvent({ event: "listing_view", listing_type: listingType, listing_id: listingId, category, value, currency });
  }, [listingType, listingId, category, value, currency]);
  return null;
}
