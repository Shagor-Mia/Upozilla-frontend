"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ListingImage } from "@/components/listings/ListingImage";
import { PriceTag } from "@/components/listings/PriceTag";
import { StatusChip } from "@/components/listings/StatusChip";
import { Button } from "@/components/ui/button";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { formatRelativeTime, listingHref } from "@/lib/format";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { ExchangeListing, Listing, MarketplaceProduct } from "@/types/api";

function endpointFor(listing: Listing): string {
  return listing.listing_type === "exchange"
    ? `exchange/listings/${listing.id}`
    : `marketplace/products/${listing.id}`;
}

async function fetchMyListings(): Promise<Listing[]> {
  const [exchange, products] = await Promise.all([
    clientApi.get<ExchangeListing[]>("exchange/listings/mine"),
    clientApi.get<MarketplaceProduct[]>("marketplace/products/mine"),
  ]);
  return [...exchange, ...products].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/** Seller's own listings across both kinds with the status transitions the
 * backend allows sellers: active <-> sold, remove (soft delete). */
export function MyListings() {
  const [listings, setListings] = useState<Listing[] | null>(null);
  const { run, pending: busyId, error, setError } = useApiMutation("Something went wrong");

  const load = useCallback(
    () =>
      fetchMyListings()
        .then(setListings)
        .catch((err) => setError(err instanceof ClientApiError ? err.message : "Could not load your listings")),
    [setError]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(listing: Listing, status: string) {
    await run(() => clientApi.patch(endpointFor(listing), { status }), {
      key: listing.id,
      fallbackError: "Could not update the listing",
      onSuccess: load,
    });
  }

  async function remove(listing: Listing) {
    if (!window.confirm("Remove this listing? It will no longer be visible to buyers.")) return;
    await run(() => clientApi.delete(endpointFor(listing)), {
      key: listing.id,
      fallbackError: "Could not remove the listing",
      onSuccess: load,
    });
  }

  if (error && !listings) return <p className="text-body-md text-error">{error}</p>;
  if (!listings) return <div className="h-40 animate-pulse rounded-xl bg-surface-container" aria-hidden="true" />;

  const visible = listings.filter((l) => l.status !== "removed" && l.status !== "hidden");

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        <p className="text-body-md text-on-surface-variant">You haven&apos;t posted anything yet.</p>
        <Button render={<Link href="/sell" />} nativeButton={false} className="mt-4">
          Post your first listing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-body-md text-error">{error}</p>}
      {visible.map((listing) => {
        const busy = busyId === listing.id;
        return (
          <div
            key={listing.id}
            className="flex flex-col gap-4 rounded-xl border border-border-muted bg-surface-container-lowest p-4 shadow-card sm:flex-row sm:items-center"
          >
            <ListingImage src={listing.images[0]} alt="" sizes="96px" className="w-full sm:w-28" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={listing.moderation_status} label={`Moderation: ${listing.moderation_status}`} />
                <StatusChip status={listing.status} />
                <span className="text-metadata text-on-surface-variant capitalize">{listing.listing_type}</span>
              </div>
              <Link
                href={listingHref(listing.listing_type, listing.id)}
                className="text-body-md mt-1 block truncate font-semibold text-on-surface hover:text-primary"
              >
                {listing.title}
              </Link>
              <p className="text-metadata mt-1 flex flex-wrap items-center gap-2 text-on-surface-variant">
                <PriceTag price={listing.price} currency={listing.currency} />
                <span>Posted {formatRelativeTime(listing.created_at)}</span>
                <span>· {listing.favorites_count} saves</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col">
              {listing.status === "active" ? (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(listing, "sold")}>
                  Mark as sold
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus(listing, "active")}>
                  Relist
                </Button>
              )}
              <Button size="sm" variant="destructive" disabled={busy} onClick={() => remove(listing)}>
                Remove
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
