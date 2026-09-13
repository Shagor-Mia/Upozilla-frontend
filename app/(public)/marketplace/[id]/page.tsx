import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingDetail } from "@/components/listings/ListingDetail";
import { config } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { getMarketplaceProduct, listingJsonLd } from "@/lib/listings";

export async function generateMetadata(props: PageProps<"/marketplace/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const product = await getMarketplaceProduct(id);
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
      siteName: config.siteName,
    },
    twitter: { card: product.images.length ? "summary_large_image" : "summary" },
  };
}

export default async function MarketplaceProductPage(props: PageProps<"/marketplace/[id]">) {
  const { id } = await props.params;
  const product = await getMarketplaceProduct(id);
  if (!product) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingJsonLd(product, `${config.siteUrl}/marketplace/${product.id}`)),
        }}
      />
      <ListingDetail listing={product} />
    </>
  );
}
