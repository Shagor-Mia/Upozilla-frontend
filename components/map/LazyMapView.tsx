"use client";

import dynamic from "next/dynamic";

/**
 * `MapView` pulls in mapbox-gl (~200KB+) at module scope, so every detail page
 * that rendered it directly shipped that weight in its initial client bundle
 * even before the map was needed - unlike UpazilaHero3D's three.js scene,
 * which was already dynamic()-ed with ssr:false (see
 * upazila-seo-aeo-geo-aio-sxo-audit memory, SXO finding). Server Components
 * can't pass `ssr: false` to `next/dynamic` directly, so this thin client
 * wrapper does it instead - detail pages import `LazyMapView` in place of
 * `MapView`.
 */
export const LazyMapView = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-xl border border-border-muted bg-surface-container-low" />
  ),
});
