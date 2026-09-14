"use client";

import { useTranslations } from "next-intl";

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** DESIGN.md: marketplace pricing is bold, `label-sm`, in the secondary (gold) accent.
 *
 * Client Component (not async, uses the client-safe `useTranslations` hook)
 * so it can be rendered from either a Server Component (e.g. ListingDetail)
 * or a Client Component (e.g. MyListings) tree - the reverse (an async
 * Server Component rendered from "use client") is not supported by Next.js
 * and previously crashed /account/listings whenever a listing existed. */
export function PriceTag({
  price,
  currency,
  negotiable = false,
  size = "sm",
  className,
}: {
  price: number;
  currency: string;
  negotiable?: boolean;
  size?: "sm" | "lg";
  className?: string;
}) {
  const t = useTranslations("priceTag");
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "rounded-full bg-secondary font-bold text-secondary-foreground",
          size === "lg" ? "text-headline-md px-4 py-1" : "text-label-sm px-3 py-0.5"
        )}
      >
        {formatPrice(price, currency)}
      </span>
      {negotiable && <span className="text-metadata text-on-surface-variant">{t("negotiable")}</span>}
    </span>
  );
}
