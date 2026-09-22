import { FileSignature, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ListingGrid } from "@/components/listings/ListingGrid";
import { SellerCard } from "@/components/listings/SellerCard";
import { ReviewForm } from "@/components/sellers/ReviewForm";
import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import type { ExchangeListing, MarketplaceProduct, Paginated, SellerProfile } from "@/types/api";

async function getSeller(id: string): Promise<SellerProfile | null> {
  try {
    return await apiGet<SellerProfile>(`/sellers/${id}`, { revalidateSeconds: 60 });
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/sellers/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const seller = await getSeller(id);
  if (!seller) return {};
  const t = await getTranslations("sellerProfile");
  return {
    title: t("metaTitle", { name: seller.full_name }),
    description: t("metaDescription", {
      active: seller.active_listings,
      reviews: seller.review_count,
    }),
    robots: { index: false },
  };
}

export default async function SellerProfilePage(props: PageProps<"/sellers/[id]">) {
  const { id } = await props.params;
  const seller = await getSeller(id);
  if (!seller) notFound();

  const t = await getTranslations("sellerProfile");

  // Listing endpoints only return publicly visible items, so this stays safe to
  // render for anyone.
  const [exchange, products] = await Promise.all([
    apiGet<Paginated<ExchangeListing>>("/exchange/listings", {
      revalidateSeconds: 60,
      searchParams: { page_size: "12" },
    }).then((r) => r.items.filter((item) => item.seller_user_id === seller.id)),
    apiGet<Paginated<MarketplaceProduct>>("/marketplace/products", {
      revalidateSeconds: 60,
      searchParams: { page_size: "12" },
    }).then((r) => r.items.filter((item) => item.seller_user_id === seller.id)),
  ]);
  const listings = [...exchange, ...products];

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <div className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
        <SellerCard seller={seller} linkToProfile={false} />
        <Link
          href={`/contracts/new?workerId=${encodeURIComponent(seller.id)}&workerName=${encodeURIComponent(seller.full_name)}`}
          className="text-label-sm mt-3 inline-flex items-center gap-1.5 text-primary hover:underline"
        >
          <FileSignature size={16} />
          {t("createContract")}
        </Link>
        <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-border-muted pt-4">
          <div>
            <dt className="text-metadata text-on-surface-variant">{t("activeListings")}</dt>
            <dd className="text-headline-md text-on-surface">{seller.active_listings}</dd>
          </div>
          <div>
            <dt className="text-metadata text-on-surface-variant">{t("totalListings")}</dt>
            <dd className="text-headline-md text-on-surface">{seller.total_listings}</dd>
          </div>
          <div>
            <dt className="text-metadata text-on-surface-variant">{t("trustScore")}</dt>
            <dd className="text-headline-md text-on-surface">{seller.trust_score}</dd>
          </div>
        </dl>
      </div>

      <section className="mt-10">
        <h2 className="text-headline-lg mb-4 text-on-surface">{t("recentListings")}</h2>
        <ListingGrid listings={listings} emptyMessage={t("noPublicListings")} />
      </section>

      <section className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div>
          <h2 className="text-headline-lg mb-4 text-on-surface">
            {t("reviewsCount", { count: seller.review_count })}
          </h2>
          {seller.reviews.length === 0 ? (
            <p className="text-body-md text-on-surface-variant">{t("noReviewsYet")}</p>
          ) : (
            <ul className="space-y-3">
              {seller.reviews.map((review) => (
                <li
                  key={review.id}
                  className="rounded-xl border border-border-muted bg-surface-container-lowest p-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-sm text-on-surface">{review.reviewer_name}</span>
                    <span className="text-metadata text-on-surface-variant">{formatRelativeTime(review.created_at)}</span>
                  </div>
                  <div
                    className="mt-1 flex items-center gap-0.5"
                    aria-label={t("ratingAriaLabel", { rating: review.rating })}
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={14}
                        className={value <= review.rating ? "fill-secondary text-secondary" : "text-outline-variant"}
                      />
                    ))}
                  </div>
                  {review.comment && <p className="text-body-md mt-2 text-on-surface-variant">{review.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
          <h3 className="text-headline-md mb-3 text-on-surface">{t("leaveAReview")}</h3>
          <ReviewForm sellerId={seller.id} />
        </div>
      </section>
    </div>
  );
}
