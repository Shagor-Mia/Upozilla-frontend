import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import type {
  ExchangeListing,
  Listing,
  MarketplaceCategory,
  MarketplaceProduct,
  Paginated,
} from "@/types/api";

/** Server-side fetch helpers shared by the marketplace/exchange routes
 * (Section 20.4: one fetching pattern reused everywhere). Listing content is
 * user-generated and moderated, so it revalidates faster than editorial pages. */
const LISTING_REVALIDATE_SECONDS = 60;

export type ListingSearchParams = Record<string, string | string[] | undefined>;

function pick(searchParams: ListingSearchParams, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value ? value : undefined;
}

export function listingQuery(searchParams: ListingSearchParams): Record<string, string | undefined> {
  return {
    q: pick(searchParams, "q"),
    category_id: pick(searchParams, "category"),
    sort: pick(searchParams, "sort"),
    condition: pick(searchParams, "condition"),
    page: pick(searchParams, "page"),
    location_id: pick(searchParams, "location_id"),
  };
}

/** Same values keyed the way the URL uses them (for Pagination links). `type`
 * ("exchange" or unset for marketplace) isn't a backend param - it just picks
 * which of getMarketplaceProducts/getExchangeListings the merged /marketplace
 * page calls - so it's kept out of listingQuery() and only carried here. */
export function listingUrlParams(searchParams: ListingSearchParams): Record<string, string | undefined> {
  return {
    q: pick(searchParams, "q"),
    category: pick(searchParams, "category"),
    sort: pick(searchParams, "sort"),
    condition: pick(searchParams, "condition"),
    page: pick(searchParams, "page"),
    location_id: pick(searchParams, "location_id"),
    type: pick(searchParams, "type"),
  };
}

export function getCategories(): Promise<MarketplaceCategory[]> {
  return apiGet<MarketplaceCategory[]>("/marketplace/categories", { revalidateSeconds: 3600 });
}

export function getExchangeListings(searchParams: ListingSearchParams): Promise<Paginated<ExchangeListing>> {
  return apiGet<Paginated<ExchangeListing>>("/exchange/listings", {
    revalidateSeconds: LISTING_REVALIDATE_SECONDS,
    searchParams: listingQuery(searchParams),
  });
}

export function getMarketplaceProducts(searchParams: ListingSearchParams): Promise<Paginated<MarketplaceProduct>> {
  return apiGet<Paginated<MarketplaceProduct>>("/marketplace/products", {
    revalidateSeconds: LISTING_REVALIDATE_SECONDS,
    searchParams: listingQuery(searchParams),
  });
}

async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path, { revalidateSeconds: LISTING_REVALIDATE_SECONDS });
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export function getExchangeListing(id: string): Promise<ExchangeListing | null> {
  return getOrNull<ExchangeListing>(`/exchange/listings/${id}`);
}

export function getMarketplaceProduct(id: string): Promise<MarketplaceProduct | null> {
  return getOrNull<MarketplaceProduct>(`/marketplace/products/${id}`);
}

export function listingJsonLd(listing: Listing, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description ?? undefined,
    image: listing.images.length ? listing.images : undefined,
    itemCondition:
      listing.condition === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      url,
      price: listing.price,
      priceCurrency: listing.currency,
      availability:
        listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      seller: { "@type": "Person", name: listing.seller.full_name },
    },
  };
}
