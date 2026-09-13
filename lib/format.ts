/** Bangladesh uses lakh/crore grouping (1,00,000) - en-IN matches that. */
const bdNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatPrice(price: number, currency = "BDT"): string {
  const amount = bdNumber.format(price);
  return currency === "BDT" ? `৳${amount}` : `${amount} ${currency}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso)
  );
}

/** Section 19.6: timestamps are UTC server-side; render relative to the viewer's clock. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const diffSeconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSeconds, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSeconds / 86400), "day");
  return formatDate(iso);
}

export function listingHref(listingType: "exchange" | "marketplace" | "shop", id: string): string {
  const segment = listingType === "shop" ? "shops" : listingType;
  return `/${segment}/${id}`;
}

/** Distance from the visitor for "near me" chips. The API rounds to 1 decimal;
 * keep the trailing zero ("2.0 km") so the chips line up. */
export function formatDistanceKm(km: number): string {
  return km < 0.1 ? "< 0.1 km" : `${km.toFixed(1)} km`;
}
