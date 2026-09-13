import { MapPin } from "lucide-react";
import Link from "next/link";

import { ListingImage } from "@/components/listings/ListingImage";
import { PriceTag } from "@/components/listings/PriceTag";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, listingHref } from "@/lib/format";
import type { Listing } from "@/types/api";

/** DESIGN.md "Marketplace Cards": photo-forward, visible price tag, seller
 * identity + verified badge. Vertical stack (image top, details bottom). */
export function ListingCard({ listing, priority = false }: { listing: Listing; priority?: boolean }) {
  const negotiable = listing.listing_type === "exchange" && listing.is_negotiable;
  return (
    <Link
      href={listingHref(listing.listing_type, listing.id)}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-muted bg-surface-container-lowest shadow-card transition-shadow duration-150 ease-out hover:shadow-md"
    >
      <ListingImage src={listing.images[0]} alt={listing.title} priority={priority} className="rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <PriceTag price={listing.price} currency={listing.currency} negotiable={negotiable} />
          <Badge variant="outline" className="capitalize">
            {listing.condition}
          </Badge>
        </div>
        <h3 className="text-body-md line-clamp-2 font-semibold text-on-surface group-hover:text-primary">
          {listing.title}
        </h3>
        <p className="text-metadata flex items-center gap-1 text-on-surface-variant">
          <MapPin size={12} />
          {listing.location_name}
          <span aria-hidden="true">·</span>
          {formatRelativeTime(listing.created_at)}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-metadata truncate text-on-surface-variant">
            {listing.listing_type === "marketplace" && listing.business_name
              ? listing.business_name
              : listing.seller.full_name}
          </span>
          {listing.seller.phone_verified && <VerifiedBadge label="Verified" />}
        </div>
      </div>
    </Link>
  );
}
