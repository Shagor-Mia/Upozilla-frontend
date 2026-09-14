"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { selectClass } from "@/components/ui/field-styles";
import { cn } from "@/lib/utils";
import type { ListingSort, MarketplaceCategory } from "@/types/api";

/** Search + category chips + sort/condition selects, all reflected in the URL
 * so listing pages stay shareable and server-rendered. */
export function ListingFilters({ categories }: { categories: MarketplaceCategory[] }) {
  const t = useTranslations("listingFilters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
    { value: "newest", label: t("sortNewest") },
    { value: "price_asc", label: t("sortPriceAsc") },
    { value: "price_desc", label: t("sortPriceDesc") },
  ];

  const activeCategory = searchParams.get("category") ?? "";

  function withParam(key: string, value: string | null): string {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(withParam("q", query.trim() || null));
  }

  return (
    <div className="space-y-4">
      {/* Search gets its own full-width row below `sm:` - the sort/condition
          selects used to share one un-wrapping row with it, squeezing the
          search box down to an unreadable ~64px on a phone (see the
          mobile-responsiveness-audit memory, finding #4). */}
      <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-4 -translate-y-1/2 text-outline" size={18} />
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className={cn(selectClass, "ps-11")}
          />
        </label>
        <div className="flex gap-2">
          <select
            aria-label={t("sortAriaLabel")}
            value={searchParams.get("sort") ?? "newest"}
            onChange={(e) => router.push(withParam("sort", e.target.value === "newest" ? null : e.target.value))}
            className={cn(selectClass, "min-w-0 flex-1 sm:w-auto sm:flex-none")}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label={t("conditionAriaLabel")}
            value={searchParams.get("condition") ?? ""}
            onChange={(e) => router.push(withParam("condition", e.target.value || null))}
            className={cn(selectClass, "min-w-0 flex-1 sm:w-auto sm:flex-none")}
          >
            <option value="">{t("anyCondition")}</option>
            <option value="new">{t("conditionNew")}</option>
            <option value="used">{t("conditionUsed")}</option>
          </select>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link
          href={withParam("category", null)}
          className={cn(
            "text-label-sm rounded-full border px-4 py-1.5 transition-colors",
            !activeCategory
              ? "border-primary bg-primary text-on-primary"
              : "border-border-muted bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
          )}
        >
          {t("allCategories")}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={withParam("category", category.id)}
            className={cn(
              "text-label-sm rounded-full border px-4 py-1.5 transition-colors",
              activeCategory === category.id
                ? "border-primary bg-primary text-on-primary"
                : "border-border-muted bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
