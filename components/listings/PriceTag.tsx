import { getTranslations } from "next-intl/server";

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** DESIGN.md: marketplace pricing is bold, `label-sm`, in the secondary (gold) accent. */
export async function PriceTag({
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
  const t = await getTranslations("priceTag");
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
