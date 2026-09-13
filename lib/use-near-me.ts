import { useCallback, useRef, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { ClientApiError, clientApi } from "@/lib/client-api";
import type { Paginated } from "@/types/api";

/** Public directory lists that accept `?lat&lng&radius_km` (Phase 3 "near me"). */
export type DirectoryEntity = "hospitals" | "markets" | "places" | "businesses";

// hospitals/markets/places return Paginated<T>; businesses still returns a plain array.
const PAGINATED_ENTITIES = new Set<DirectoryEntity>(["hospitals", "markets", "places"]);

export type NearMeRadius = 5 | 10 | 25;
export const NEAR_ME_RADII: readonly NearMeRadius[] = [5, 10, 25];
export const DEFAULT_NEAR_ME_RADIUS: NearMeRadius = 10;

export type NearMeStatus =
  /** Showing the server-rendered list. */
  | "idle"
  /** Waiting on the browser permission prompt / position fix. */
  | "locating"
  /** Have coordinates, fetching the filtered list. */
  | "loading"
  /** Near-me results are on screen. */
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

interface Coords {
  lat: number;
  lng: number;
}

/**
 * Drives the "near me" mode of a public directory page. The SSR list stays
 * the default; once the visitor opts in we ask the browser for a position and
 * refetch the same endpoint (through the `/api/backend` proxy) with
 * `lat/lng/radius_km`. `items` is null until a near-me result has landed, so
 * the caller can fall back to its server-rendered props.
 */
export function useNearMe<T>(entity: DirectoryEntity) {
  const [status, setStatus] = useState<NearMeStatus>("idle");
  const [radius, setRadiusState] = useState<NearMeRadius>(DEFAULT_NEAR_ME_RADIUS);
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const coordsRef = useRef<Coords | null>(null);
  // Bumped on every fetch/reset so a stale response can't overwrite a newer one.
  const requestIdRef = useRef(0);

  const fetchNearby = useCallback(
    async (coords: Coords, radiusKm: NearMeRadius) => {
      const requestId = ++requestIdRef.current;
      setStatus("loading");
      setError(null);
      try {
        // 5 decimals is ~1 m - plenty for a radius search without sending a
        // more precise fingerprint than needed.
        const params = new URLSearchParams({
          lat: coords.lat.toFixed(5),
          lng: coords.lng.toFixed(5),
          radius_km: String(radiusKm),
        });
        const result = PAGINATED_ENTITIES.has(entity)
          ? (await clientApi.get<Paginated<T>>(`${entity}?${params.toString()}`)).items
          : await clientApi.get<T[]>(`${entity}?${params.toString()}`);
        if (requestId !== requestIdRef.current) return;
        setItems(result);
        setStatus("ready");
        trackEvent({ event: "near_me_used", entity, radius_km: radiusKm });
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof ClientApiError ? err.message : "Could not load nearby results.");
        setStatus("error");
      }
    },
    [entity]
  );

  const activate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    if (coordsRef.current) {
      void fetchNearby(coordsRef.current, radius);
      return;
    }
    setStatus("locating");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        coordsRef.current = coords;
        void fetchNearby(coords, radius);
      },
      (positionError) => {
        if (positionError.code === positionError.PERMISSION_DENIED) {
          setStatus("denied");
          return;
        }
        setError("Could not determine your location. Please try again.");
        setStatus("error");
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 5 * 60 * 1000 }
    );
  }, [fetchNearby, radius]);

  const setRadius = useCallback(
    (next: NearMeRadius) => {
      setRadiusState(next);
      if (coordsRef.current) void fetchNearby(coordsRef.current, next);
    },
    [fetchNearby]
  );

  /** Back to the server-rendered "everything" list. Keeps the cached position
   * so re-enabling near-me doesn't re-prompt. */
  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setItems(null);
    setError(null);
    setStatus("idle");
  }, []);

  return { status, radius, items, error, activate, setRadius, reset };
}
