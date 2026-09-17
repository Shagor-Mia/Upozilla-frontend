import type { MetadataRoute } from "next";

import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type {
  Business,
  ExchangeListing,
  Location,
  MarketplaceProduct,
  NewsArticle,
  Paginated,
  Place,
  Shop,
} from "@/types/api";

const STATIC_ROUTES = [
  "/",
  "/places",
  "/services",
  "/markets",
  "/hospitals",
  "/popular-services",
  "/shops",
  "/govt-info",
  "/news",
  "/marketplace",
  "/unions",
  "/faq",
];

/** A failed dynamic fetch used to silently ship the sitemap with 0 entries for
 * that content type via `.catch(() => [])` with no logging - a transient
 * Render cold start (upazila-free-hosting-setup memory) could wipe most of
 * the sitemap and nobody would notice. Logged now, same pattern as the
 * homepage's `safe()` helper (app/(public)/page.tsx). */
async function safe<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`[sitemap] failed to load ${label}`, error);
    return fallback;
  }
}

// There's no single "list all unions" endpoint (see app/(public)/unions/page.tsx) -
// unions are fetched as children of the (single, per upazila-phase*-decisions
// memory) upazila this deployment serves.
async function getUnions(): Promise<Location[]> {
  const upazilas = await safe(
    apiGet<Location[]>("/locations", { searchParams: { type: "upazila" } }),
    [],
    "upazilas (for unions)",
  );
  const upazila = upazilas[0];
  if (!upazila) return [];
  return safe(
    apiGet<Location[]>("/locations", { searchParams: { type: "union", parent_id: upazila.id } }),
    [],
    "unions",
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ site_url: siteUrl }, places, businesses, news, exchange, products, unions, shops] = await Promise.all([
    getPublicSettings(),
    safe(
      apiGet<Paginated<Place>>("/places", { searchParams: { page_size: "60" } }).then((r) => r.items),
      [],
      "places",
    ),
    safe(apiGet<Business[]>("/businesses"), [], "businesses"),
    safe(
      apiGet<Paginated<NewsArticle>>("/news", { searchParams: { page_size: "60" } }).then((r) => r.items),
      [],
      "news",
    ),
    safe(
      apiGet<Paginated<ExchangeListing>>("/exchange/listings", { searchParams: { page_size: "60" } }).then(
        (r) => r.items,
      ),
      [],
      "exchange listings",
    ),
    safe(
      apiGet<Paginated<MarketplaceProduct>>("/marketplace/products", { searchParams: { page_size: "60" } }).then(
        (r) => r.items,
      ),
      [],
      "marketplace products",
    ),
    getUnions(),
    safe(
      apiGet<Paginated<Shop>>("/shops", { searchParams: { page_size: "60" } }).then((r) => r.items),
      [],
      "shops",
    ),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.7,
  }));

  const placeEntries: MetadataRoute.Sitemap = places.map((place) => ({
    url: `${siteUrl}/places/${place.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const businessEntries: MetadataRoute.Sitemap = businesses.map((business) => ({
    url: `${siteUrl}/popular-services/${business.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const newsEntries: MetadataRoute.Sitemap = news.map((article) => ({
    url: `${siteUrl}/news/${article.slug}`,
    lastModified: article.published_at ? new Date(article.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const listingEntries: MetadataRoute.Sitemap = [
    ...exchange.map((listing) => ({
      url: `${siteUrl}/exchange/${listing.id}`,
      lastModified: new Date(listing.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/marketplace/${product.id}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];

  const unionEntries: MetadataRoute.Sitemap = unions.map((union) => ({
    url: `${siteUrl}/unions/${union.id}`,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const shopEntries: MetadataRoute.Sitemap = shops.map((shop) => ({
    url: `${siteUrl}/shops/${shop.id}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [
    ...staticEntries,
    ...placeEntries,
    ...businessEntries,
    ...newsEntries,
    ...listingEntries,
    ...unionEntries,
    ...shopEntries,
  ];
}
