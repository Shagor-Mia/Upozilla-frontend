import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingDetail } from "@/components/listings/ListingDetail";
import { formatPrice } from "@/lib/format";
import { getMarketplaceProduct, listingJsonLd } from "@/lib/listings";
import { getPublicSettings } from "@/lib/public-settings";

export async function generateMetadata(props: PageProps<"/marketplace/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [product, { site_name }] = await Promise.all([getMarketplaceProduct(id), getPublicSettings()]);
  if (!product) return {};

  const description =
    product.description?.slice(0, 160) ??
    `${product.title} for ${formatPrice(product.price, product.currency)}${product.business_name ? ` from ${product.business_name}` : ""}`;

  return {
    title: `${product.title} — ${formatPrice(product.price, product.currency)}`,
    description,
    alternates: { canonical: `/marketplace/${product.id}` },
    openGraph: {
      title: product.title,
      description,
      type: "website",
      images: product.images.length ? [product.images[0]] : undefined,
      siteName: site_name,
    },
    twitter: { card: product.images.length ? "summary_large_image" : "summary" },
  };
}

export default async function MarketplaceProductPage(props: PageProps<"/marketplace/[id]">) {
  const { id } = await props.params;
  const [product, { site_url }] = await Promise.all([getMarketplaceProduct(id), getPublicSettings()]);
  if (!product) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingJsonLd(product, `${site_url}/marketplace/${product.id}`)),
        }}
      />
      <ListingDetail listing={product} />
    </>
  );
}
