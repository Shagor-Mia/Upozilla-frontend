import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { formatDate } from "@/lib/format";
import type { SellerSummary } from "@/types/api";

export async function SellerCard({ seller, linkToProfile = true }: { seller: SellerSummary; linkToProfile?: boolean }) {
  const t = await getTranslations("sellerCard");
  const initials = seller.full_name
    .split(/\s+/)
    .map((part) => part.replace(/[^\p{L}]/gu, "")[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const body = (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
        <span className="text-label-sm font-bold">{initials || "?"}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-md truncate font-semibold text-on-surface">{seller.full_name}</span>
          {seller.phone_verified && <VerifiedBadge />}
        </div>
        <p className="text-metadata flex flex-wrap items-center gap-x-2 text-on-surface-variant">
          {seller.avg_rating !== null ? (
            <span className="inline-flex items-center gap-0.5">
              <Star size={12} className="fill-secondary text-secondary" />
              {seller.avg_rating.toFixed(1)} ({seller.review_count})
            </span>
          ) : (
            <span>{t("noReviewsYet")}</span>
          )}
          <span aria-hidden="true">·</span>
          <span>{t("memberSince", { date: formatDate(seller.member_since) })}</span>
        </p>
      </div>
    </div>
  );

  if (!linkToProfile) return body;
  return (
    <Link href={`/sellers/${seller.id}`} className="block rounded-xl transition-colors hover:bg-surface-container-low">
      {body}
    </Link>
  );
}
