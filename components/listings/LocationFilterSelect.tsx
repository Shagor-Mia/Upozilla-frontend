"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { selectClass } from "@/components/ui/field-styles";
import { cn } from "@/lib/utils";

interface LocationOption {
  value: string;
  label: string;
}

/** Filters the current page's listing by `location_id` (union or village) -
 * shared by the marketplace/exchange listing filters and the markets page,
 * since both are backed by a `location_id` query param the API already
 * supports. Union/village pages link INTO this filter instead of the header
 * nav trying to enumerate every union. */
export function LocationFilterSelect({
  locations,
  ariaLabel,
  anyLabel,
}: {
  locations: LocationOption[];
  ariaLabel: string;
  anyLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("location_id") ?? "";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("location_id", value);
    else params.delete("location_id");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <select
      aria-label={ariaLabel}
      value={active}
      onChange={(e) => onChange(e.target.value)}
      className={cn(selectClass, "min-w-0 flex-1 sm:w-auto sm:flex-none")}
    >
      <option value="">{anyLabel}</option>
      {locations.map((location) => (
        <option key={location.value} value={location.value}>
          {location.label}
        </option>
      ))}
    </select>
  );
}
