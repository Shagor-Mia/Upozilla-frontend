import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ListingDetail } from "@/components/listings/ListingDetail";
import { formatPrice } from "@/lib/format";
import { getExchangeListing, listingJsonLd } from "@/lib/listings";
import { getPublicSettings } from "@/lib/public-settings";

export async function generateMetadata(props: PageProps<"/exchange/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const [listing, { site_name }] = await Promise.all([getExchangeListing(id), getPublicSettings()]);
  if (!listing) return {};

  const description =
    listing.description?.slice(0, 160) ??
    `${listing.title} for ${formatPrice(listing.price, listing.currency)} in ${listing.location_name}`;

  return {
    title: `${listing.title} — ${formatPrice(listing.price, listing.currency)}`,
    description,
    alternates: { canonical: `/exchange/${listing.id}` },
    openGraph: {
      title: listing.title,
      description,
      type: "website",
      images: listing.images.length ? [listing.images[0]] : undefined,
      siteName: site_name,
    },
    twitter: { card: listing.images.length ? "summary_large_image" : "summary" },
  };
}

export default async function ExchangeListingPage(props: PageProps<"/exchange/[id]">) {
  const { id } = await props.params;
  const [listing, { site_url }] = await Promise.all([getExchangeListing(id), getPublicSettings()]);
  if (!listing) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(listingJsonLd(listing, `${site_url}/exchange/${listing.id}`)),
        }}
      />
      <ListingDetail listing={listing} />
    </>
  );
}
