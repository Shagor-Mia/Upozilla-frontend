import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing } from "@/types/api";

export function ListingGrid({ listings, emptyMessage }: { listings: Listing[]; emptyMessage: string }) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
        <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing, index) => (
        <ListingCard key={listing.id} listing={listing} priority={index < 4} />
      ))}
    </div>
  );
}
