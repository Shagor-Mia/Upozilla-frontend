import { MapPin, Tag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ListingActions } from "@/components/listings/ListingActions";
import { ListingImage } from "@/components/listings/ListingImage";
import { ListingViewTracker } from "@/components/listings/ListingViewTracker";
import { PriceTag } from "@/components/listings/PriceTag";
import { SellerCard } from "@/components/listings/SellerCard";
import { StatusChip } from "@/components/listings/StatusChip";
import { MapView } from "@/components/map/MapView";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import type { Listing } from "@/types/api";

/** Shared detail layout for exchange listings and marketplace products
 * (Section 10: two modules, shared UI). */
export async function ListingDetail({ listing }: { listing: Listing }) {
  const t = await getTranslations("listingDetail");
  const negotiable = listing.listing_type === "exchange" && listing.is_negotiable;
  const gallery = listing.images.slice(1, 5);
  const listHref = listing.listing_type === "exchange" ? "/exchange" : "/marketplace";
  const listLabel = listing.listing_type === "exchange" ? t("exchange") : t("marketplace");

  return (
    <article className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <ListingViewTracker
        listingType={listing.listing_type}
        listingId={listing.id}
        category={listing.category_name}
        value={listing.price}
        currency={listing.currency}
      />
      <nav className="text-metadata mb-4 flex items-center gap-2 text-on-surface-variant" aria-label={t("breadcrumbAriaLabel")}>
        <Link href={listHref} className="hover:text-primary">
          {listLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`${listHref}?category=${listing.category_id}`} className="hover:text-primary">
          {listing.category_name}
        </Link>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-4">
          <ListingImage
            src={listing.images[0]}
            alt={listing.title}
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="rounded-xl"
          />
          {gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((src) => (
                <ListingImage key={src} src={src} alt="" sizes="20vw" />
              ))}
            </div>
          )}

          <section className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
            <h2 className="text-headline-md text-on-surface">{t("description")}</h2>
            {listing.description ? (
              <p className="text-body-md mt-3 whitespace-pre-line text-on-surface-variant">{listing.description}</p>
            ) : (
              <p className="text-body-md mt-3 text-on-surface-variant">{t("noDescription")}</p>
            )}
          </section>

          {listing.latitude != null && listing.longitude != null && (
            <MapView latitude={listing.latitude} longitude={listing.longitude} label={listing.title} />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {listing.condition}
              </Badge>
              {listing.moderation_status !== "approved" && <StatusChip status={listing.moderation_status} />}
              {listing.status !== "active" && <StatusChip status={listing.status} />}
            </div>
            <h1 className="text-headline-lg mt-3 text-on-surface">{listing.title}</h1>
            <PriceTag price={listing.price} currency={listing.currency} negotiable={negotiable} size="lg" className="mt-4" />
            <dl className="text-metadata mt-4 space-y-1 text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} />
                <dd>{listing.location_name}</dd>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag size={14} />
                <dd>
                  {listing.category_name}
                  {listing.listing_type === "marketplace" && listing.business_slug && (
                    <>
                      {" · "}
                      <Link href={`/business/${listing.business_slug}`} className="text-primary hover:underline">
                        {listing.business_name}
                      </Link>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dd>{t("posted", { time: formatRelativeTime(listing.created_at) })}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
            <h2 className="text-label-sm mb-3 text-on-surface-variant">{t("seller")}</h2>
            <SellerCard seller={listing.seller} />
            <div className="mt-4">
              <ListingActions
                listingType={listing.listing_type}
                listingId={listing.id}
                sellerId={listing.seller_user_id}
                initialFavoritesCount={listing.favorites_count}
              />
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
