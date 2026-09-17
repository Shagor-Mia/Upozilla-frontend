import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ListingImage } from "@/components/listings/ListingImage";
import { Badge } from "@/components/ui/badge";
import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Shop } from "@/types/api";

async function getShop(id: string): Promise<Shop | null> {
  try {
    return await apiGet<Shop>(`/shops/${id}`);
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/shops/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [shop, { site_name }] = await Promise.all([getShop(id), getPublicSettings()]);
  if (!shop) return {};

  const description = shop.description ?? `${shop.name} — ${shop.market_name ?? shop.category_name} — ${site_name}`;

  return {
    title: shop.name,
    description,
    alternates: { canonical: `/shops/${shop.id}` },
    openGraph: {
      title: shop.name,
      description,
      type: "website",
      images: shop.images[0] ? [shop.images[0]] : undefined,
    },
  };
}

export default async function ShopDetailPage(props: PageProps<"/shops/[id]">) {
  const { id } = await props.params;
  const shop = await getShop(id);
  if (!shop) notFound();

  // AIO/GEO: Store schema, mirroring business/[slug]/page.tsx's LocalBusiness
  // block - shops previously had metadata but no structured data at all
  // (upazila-seo-aeo-geo-aio-sxo-audit memory, AIO finding).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: shop.name,
    description: shop.description ?? undefined,
    image: shop.images[0] ?? undefined,
    telephone: shop.contact_phone ?? undefined,
    branchOf: shop.market_name
      ? {
          "@type": "LocalBusiness",
          name: shop.market_name,
        }
      : undefined,
  };

  return (
    <article className="mx-auto max-w-2xl px-4 py-8 md:px-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Badge variant="secondary">{shop.category_name}</Badge>
      <h1 className="mt-3 text-display-hero-mobile text-on-surface">{shop.name}</h1>
      {shop.market_id && shop.market_name && (
        <Link href={`/markets/${shop.market_id}`} className="text-label-sm text-primary hover:underline">
          {shop.market_name}
        </Link>
      )}

      {shop.description && <p className="mt-4 text-body-md text-on-surface-variant">{shop.description}</p>}

      {shop.contact_phone && (
        <p className="mt-4 text-body-md text-on-surface">যোগাযোগ: {shop.contact_phone}</p>
      )}

      {/* flex-wrap: a long seller name + the verified badge had no wrap
          fallback (see the mobile-responsiveness-audit memory, finding #13 -
          matches the pattern SellerCard.tsx already uses). */}
      <div className="mt-6 flex flex-wrap items-center gap-2 text-body-md text-on-surface-variant">
        <span>দোকানদার: {shop.seller.full_name}</span>
        {shop.seller.phone_verified && <Badge variant="secondary">ফোন যাচাইকৃত</Badge>}
      </div>

      {shop.images.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shop.images.map((src) => (
            <ListingImage key={src} src={src} alt={shop.name} className="rounded-xl" />
          ))}
        </div>
      )}
    </article>
  );
}
