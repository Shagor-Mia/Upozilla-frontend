"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ListingImage } from "@/components/listings/ListingImage";
import { StatusChip } from "@/components/listings/StatusChip";
import { Button } from "@/components/ui/button";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { formatRelativeTime } from "@/lib/format";
import type { Shop } from "@/types/api";

/** Shopkeeper's own shops - mirrors MyListings.tsx but Shop isn't a priced
 * listing (no PriceTag/favorites_count), so it's a separate small component
 * rather than widening the ExchangeListing|MarketplaceProduct union. */
export function MyShops() {
  const [shops, setShops] = useState<Shop[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      clientApi
        .get<Shop[]>("shops/mine")
        .then(setShops)
        .catch((err) => setError(err instanceof ClientApiError ? err.message : "আপনার দোকানের তথ্য লোড করা যায়নি")),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error && !shops) return <p className="text-body-md text-error">{error}</p>;
  if (!shops) return <div className="h-40 animate-pulse rounded-xl bg-surface-container" aria-hidden="true" />;

  if (shops.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        <p className="text-body-md text-on-surface-variant">আপনি এখনও কোনো দোকান যোগ করেননি।</p>
        <Button render={<Link href="/sell/shop" />} nativeButton={false} className="mt-4">
          দোকান যোগ করুন
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {shops.map((shop) => (
        <div
          key={shop.id}
          className="flex flex-col gap-4 rounded-xl border border-border-muted bg-surface-container-lowest p-4 shadow-card sm:flex-row sm:items-center"
        >
          <ListingImage src={shop.images[0]} alt="" sizes="96px" className="w-full sm:w-28" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip status={shop.moderation_status} label={`রিভিউ: ${shop.moderation_status}`} />
              <StatusChip status={shop.status} />
              <span className="text-metadata text-on-surface-variant">{shop.category_name}</span>
            </div>
            <Link
              href={`/shops/${shop.id}`}
              className="text-body-md mt-1 block truncate font-semibold text-on-surface hover:text-primary"
            >
              {shop.name}
            </Link>
            <p className="text-metadata mt-1 text-on-surface-variant">
              {shop.market_name ?? "স্বতন্ত্র দোকান"} · যোগ হয়েছে {formatRelativeTime(shop.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
