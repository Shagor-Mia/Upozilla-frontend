import { Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LazyMapView } from "@/components/map/LazyMapView";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Market, Paginated, Shop } from "@/types/api";

async function getMarket(id: string): Promise<Market | null> {
  try {
    return await apiGet<Market>(`/markets/${id}`);
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/markets/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [market, { site_name }] = await Promise.all([getMarket(id), getPublicSettings()]);
  if (!market) return {};

  return {
    title: market.name,
    description: market.description ?? `${market.name} — ${site_name}`,
    alternates: { canonical: `/markets/${market.id}` },
  };
}

function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link href={`/shops/${shop.id}`}>
      <Card className="h-full shadow-card transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-headline-md">
            {shop.is_featured && <Star size={16} className="shrink-0 fill-warning text-warning" />}
            {shop.name}
          </CardTitle>
          <Badge variant="secondary" className="w-fit">
            {shop.category_name}
          </Badge>
        </CardHeader>
        {shop.description && (
          <CardContent className="line-clamp-2 text-body-md text-on-surface-variant">{shop.description}</CardContent>
        )}
      </Card>
    </Link>
  );
}

export default async function MarketDetailPage(props: PageProps<"/markets/[id]">) {
  const { id } = await props.params;
  const market = await getMarket(id);
  if (!market) notFound();

  const shops = await apiGet<Paginated<Shop>>("/shops", {
    searchParams: { market_id: id, page_size: "60" },
  });
  const featured = shops.items.filter((s) => s.is_featured);
  const rest = shops.items.filter((s) => !s.is_featured);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-12">
      <Badge variant="secondary" className="capitalize">
        {market.type}
      </Badge>
      <h1 className="mt-3 text-display-hero-mobile text-on-surface">{market.name}</h1>
      <div className="mt-4 space-y-1 text-body-md text-on-surface-variant">
        <p>{market.market_day?.join(", ") ?? "সময়সূচী শীঘ্রই যোগ হবে"}</p>
        {market.start_time && market.end_time && (
          <p>
            {market.start_time} – {market.end_time}
          </p>
        )}
      </div>

      {market.description && (
        <div className="mt-6 rounded-xl border border-border-muted bg-surface-container-lowest p-4">
          <p className="text-body-md whitespace-pre-line text-on-surface">{market.description}</p>
        </div>
      )}

      {market.latitude != null && market.longitude != null && (
        <LazyMapView latitude={market.latitude} longitude={market.longitude} label={market.name} className="mt-6" />
      )}

      {featured.length > 0 && (
        <div className="mt-8">
          <h2 className="flex items-center gap-1.5 text-headline-md text-on-surface">
            <Star size={18} className="fill-warning text-warning" />
            জনপ্রিয় দোকান
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featured.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-headline-md text-on-surface">এই বাজারের দোকানসমূহ</h2>
        {rest.length === 0 && featured.length === 0 ? (
          <p className="mt-4 text-body-md text-on-surface-variant">
            এখনও কোনো দোকান যোগ করা হয়নি। আপনার দোকান থাকলে যুক্ত করুন।
          </p>
        ) : rest.length === 0 ? (
          <p className="mt-4 text-body-md text-on-surface-variant">উপরের জনপ্রিয় দোকানগুলো ছাড়া আর কোনো দোকান নেই।</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rest.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
