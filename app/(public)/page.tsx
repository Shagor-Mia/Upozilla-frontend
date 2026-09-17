import { Hospital, Landmark, Search, Store } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForYouSection } from "@/components/home/ForYouSection";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { UpazilaHero3D } from "@/components/three/UpazilaHero3D";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type {
  Business,
  ExchangeListing,
  Market,
  MarketplaceProduct,
  NewsArticle,
  Paginated,
  Place,
  Service,
} from "@/types/api";

const EMPTY_PAGE: Paginated<never> = { items: [], total: 0, page: 1, page_size: 0 };

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name, site_description }] = await Promise.all([
    getTranslations("home"),
    getPublicSettings(),
  ]);
  // A dashboard-set default description (Admin > Settings > Site identity)
  // wins over the hardcoded hero subtitle translation.
  const description = site_description || t("heroSubtitle");

  return {
    // `absolute` bypasses the root layout's `%s | siteName` template - Home
    // *is* the site, so titling it "siteName | siteName" would be redundant.
    title: { absolute: site_name },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      title: site_name,
      description,
      type: "website",
      url: "/",
    },
    twitter: {
      card: "summary_large_image",
      title: site_name,
      description,
    },
  };
}

/** Lets one failing/slow backend call degrade to an empty section instead of
 * throwing the whole homepage's Server Component render (surfaced to users
 * as the generic "Minified React error #441" - see the
 * upazila-redirect-hydration-investigation memory). Most likely trigger: a
 * Render free-tier cold start (see upazila-free-hosting-setup memory) making
 * one of the seven parallel calls below time out. Errors are still logged
 * server-side so a real outage doesn't fail silently. */
async function safe<T>(promise: Promise<T>, fallback: T, label: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`[home] failed to load ${label}`, error);
    return fallback;
  }
}

async function getLandingData() {
  const [places, services, markets, news, businesses, exchange, products] = await Promise.all([
    safe(apiGet<Paginated<Place>>("/places", { searchParams: { featured_only: "true" } }), EMPTY_PAGE, "places"),
    safe(apiGet<Paginated<Service>>("/services"), EMPTY_PAGE, "services"),
    safe(apiGet<Paginated<Market>>("/markets"), EMPTY_PAGE, "markets"),
    safe(apiGet<Paginated<NewsArticle>>("/news"), EMPTY_PAGE, "news"),
    safe(apiGet<Business[]>("/businesses"), [], "businesses"),
    safe(
      apiGet<Paginated<ExchangeListing>>("/exchange/listings", {
        revalidateSeconds: 60,
        searchParams: { page_size: "4" },
      }),
      EMPTY_PAGE,
      "exchange listings",
    ),
    safe(
      apiGet<Paginated<MarketplaceProduct>>("/marketplace/products", {
        revalidateSeconds: 60,
        searchParams: { page_size: "4" },
      }),
      EMPTY_PAGE,
      "marketplace products",
    ),
  ]);

  return {
    places: places.items.slice(0, 6),
    services: services.items.slice(0, 4),
    markets: markets.items.slice(0, 4),
    news: news.items.slice(0, 4),
    businesses: businesses.slice(0, 6),
    listings: [...products.items, ...exchange.items].slice(0, 8),
  };
}

export default async function HomePage() {
  const [{ places, services, markets, news, businesses, listings }, t, { site_name }] = await Promise.all([
    getLandingData(),
    getTranslations("home"),
    getPublicSettings(),
  ]);

  const QUICK_TAGS = [
    { href: "/hospitals", label: t("quickLinkHospitals"), icon: Hospital },
    { href: "/services", label: t("quickLinkServices"), icon: Landmark },
    { href: "/markets", label: t("quickLinkBazaar"), icon: Store },
  ];

  return (
    <div>
      <section className="relative -mt-[78px] flex min-h-[60vh] w-full items-center justify-center overflow-hidden border-b border-muted md:min-h-[70vh]">
        <UpazilaHero3D />
        <div className="relative z-10 mx-auto mt-16 flex w-full max-w-3xl flex-col items-center space-y-8 px-6 text-center md:mt-0">
          <div className="space-y-2">
            <h1 className="text-display-hero-mobile text-white md:text-display-hero">
              {t("heroTitle")} <span className="text-inverse-primary">{site_name}</span>
            </h1>
            <p className="text-body-lg text-white/85">{t("heroSubtitle")}</p>
          </div>

          <form
            action="/places"
            className="flex w-full max-w-2xl items-center rounded-full border border-white/20 bg-surface/90 p-2 shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur transition-colors focus-within:border-primary"
          >
            <Search className="ml-2 text-outline" size={20} />
            <input
              name="q"
              type="text"
              placeholder={t("searchPlaceholder")}
              className="text-body-md min-w-0 flex-grow border-none bg-transparent px-3 py-3 text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="text-label-sm ml-2 rounded-full bg-primary px-6 py-3 text-on-primary shadow-sm transition-colors hover:bg-tertiary-container"
            >
              {t("searchButton")}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {QUICK_TAGS.map((tag) => (
              <Link
                key={tag.href}
                href={tag.href}
                className="text-metadata flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <tag.icon size={16} />
                {tag.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ForYouSection />

      <ContentSection
        title={t("explorePlaces")}
        viewAllHref="/places"
        empty={places.length === 0}
        viewAllLabel={t("viewAll")}
        emptyLabel={t("emptySection")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <Link key={place.id} href={`/places/${place.slug}`}>
              <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-headline-md">{place.name}</CardTitle>
                  <Badge variant="secondary" className="w-fit capitalize">
                    {place.category}
                  </Badge>
                </CardHeader>
                {place.description && (
                  <CardContent className="text-body-md line-clamp-2 text-on-surface-variant">
                    {place.description}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title={t("govServices")}
        viewAllHref="/services"
        empty={services.length === 0}
        viewAllLabel={t("viewAll")}
        emptyLabel={t("emptySection")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-headline-md">{service.name}</CardTitle>
              </CardHeader>
              {service.office_name && (
                <CardContent className="text-body-md text-on-surface-variant">
                  {service.office_name}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title={t("weeklyBazaar")}
        viewAllHref="/markets"
        empty={markets.length === 0}
        viewAllLabel={t("viewAll")}
        emptyLabel={t("emptySection")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {markets.map((market) => (
            <Link key={market.id} href={`/markets/${market.id}`}>
              <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-headline-md">{market.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-body-md text-on-surface-variant">
                  {market.market_day?.join(", ") ?? t("scheduleTba")}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title={t("marketplaceHighlights")}
        viewAllHref="/marketplace"
        empty={listings.length === 0}
        viewAllLabel={t("viewAll")}
        emptyLabel={t("emptySection")}
      >
        <ListingGrid listings={listings} emptyMessage="" />
      </ContentSection>

      <ContentSection
        title={t("localNews")}
        viewAllHref="/news"
        empty={news.length === 0}
        viewAllLabel={t("viewAll")}
        emptyLabel={t("emptySection")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {news.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`}>
              <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="font-bengali text-headline-md">{article.title}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        title={t("businessDirectory")}
        viewAllHref="/popular-services"
        empty={businesses.length === 0}
        viewAllLabel={t("viewAll")}
        emptyLabel={t("emptySection")}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Link key={business.id} href={`/popular-services/${business.slug}`}>
              <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-headline-md">{business.name}</CardTitle>
                  <Badge variant="secondary" className="w-fit capitalize">
                    {business.category}
                  </Badge>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </ContentSection>
    </div>
  );
}

function ContentSection({
  title,
  viewAllHref,
  empty,
  viewAllLabel,
  emptyLabel,
  children,
}: {
  title: string;
  viewAllHref: string;
  empty: boolean;
  viewAllLabel: string;
  emptyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-muted py-16">
      <div className="mx-auto max-w-[1280px] px-4 md:px-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-headline-lg text-on-surface">{title}</h2>
          <Link href={viewAllHref} className="text-label-sm text-primary hover:underline">
            {viewAllLabel}
          </Link>
        </div>
        {empty ? <p className="text-body-md text-on-surface-variant">{emptyLabel}</p> : children}
      </div>
    </section>
  );
}
