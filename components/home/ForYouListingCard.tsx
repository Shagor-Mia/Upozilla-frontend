"use client";

import { ImageOff, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { formatPrice, formatRelativeTime, listingHref } from "@/lib/format";
import type { Listing } from "@/types/api";

/** Client-safe re-implementation of ListingCard/ListingImage/PriceTag for use
 * inside a Client Component tree (ForYouSection). Those three are async
 * Server Components (they call `getTranslations` from "next-intl/server"),
 * which Next.js cannot render once imported into a "use client" boundary -
 * mirrors their exact visual output using the client-safe `useTranslations`
 * hook instead. */
export function ForYouListingCard({ listing, priority = false }: { listing: Listing; priority?: boolean }) {
  const t = useTranslations("listingImage");
  const tPrice = useTranslations("priceTag");
  const negotiable = listing.listing_type === "exchange" && listing.is_negotiable;

  return (
    <Link
      href={listingHref(listing.listing_type, listing.id)}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-muted bg-surface-container-lowest shadow-card transition-shadow duration-150 ease-out hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
        {listing.images[0] ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-outline">
            <ImageOff size={32} strokeWidth={1.5} />
            <span className="text-metadata">{t("noPhoto")}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <span className="text-label-sm rounded-full bg-secondary px-3 py-0.5 font-bold text-secondary-foreground">
              {formatPrice(listing.price, listing.currency)}
            </span>
            {negotiable && <span className="text-metadata text-on-surface-variant">{tPrice("negotiable")}</span>}
          </span>
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
