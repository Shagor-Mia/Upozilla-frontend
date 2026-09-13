import type { MetadataRoute } from "next";

import { apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { Business, ExchangeListing, MarketplaceProduct, NewsArticle, Paginated, Place } from "@/types/api";

const STATIC_ROUTES = [
  "/",
  "/places",
  "/services",
  "/markets",
  "/hospitals",
  "/business",
  "/news",
  "/marketplace",
  "/exchange",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [places, businesses, news, exchange, products] = await Promise.all([
    apiGet<Paginated<Place>>("/places", { searchParams: { page_size: "60" } })
      .then((r) => r.items)
      .catch(() => []),
    apiGet<Business[]>("/businesses").catch(() => []),
    apiGet<Paginated<NewsArticle>>("/news", { searchParams: { page_size: "60" } })
      .then((r) => r.items)
      .catch(() => []),
    apiGet<Paginated<ExchangeListing>>("/exchange/listings", { searchParams: { page_size: "60" } })
      .then((r) => r.items)
      .catch(() => []),
    apiGet<Paginated<MarketplaceProduct>>("/marketplace/products", { searchParams: { page_size: "60" } })
      .then((r) => r.items)
      .catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${config.siteUrl}${path}`,
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.7,
  }));

  const placeEntries: MetadataRoute.Sitemap = places.map((place) => ({
    url: `${config.siteUrl}/places/${place.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const businessEntries: MetadataRoute.Sitemap = businesses.map((business) => ({
    url: `${config.siteUrl}/business/${business.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const newsEntries: MetadataRoute.Sitemap = news.map((article) => ({
    url: `${config.siteUrl}/news/${article.slug}`,
    lastModified: article.published_at ? new Date(article.published_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  const listingEntries: MetadataRoute.Sitemap = [
    ...exchange.map((listing) => ({
      url: `${config.siteUrl}/exchange/${listing.id}`,
      lastModified: new Date(listing.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
    ...products.map((product) => ({
      url: `${config.siteUrl}/marketplace/${product.id}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ];

  return [...staticEntries, ...placeEntries, ...businessEntries, ...newsEntries, ...listingEntries];
}
