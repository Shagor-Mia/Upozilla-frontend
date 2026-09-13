"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

import { usePublicSettings } from "@/components/settings/PublicSettingsProvider";

import "mapbox-gl/dist/mapbox-gl.css";

interface MapViewProps {
  latitude: number;
  longitude: number;
  label: string;
  zoom?: number;
  className?: string;
}

/**
 * Section 2: Mapbox GL JS for web. DESIGN.md's Map Markers spec: secondary
 * (gold) marker body with a soft "float" shadow. Degrades to a static
 * coordinates line if NEXT_PUBLIC_MAPBOX_TOKEN isn't configured, instead of
 * crashing — same fallback pattern as the GTM container. The token comes from
 * the admin CMS (Settings > Maps) with NEXT_PUBLIC_MAPBOX_TOKEN as fallback.
 */
export function MapView({ latitude, longitude, label, zoom = 14, className }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapboxToken = usePublicSettings().mapbox_token;

  useEffect(() => {
    if (!mapboxToken || !containerRef.current) return;

    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [longitude, latitude],
      zoom,
      attributionControl: false,
    });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }));
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    const markerEl = document.createElement("div");
    markerEl.setAttribute("aria-label", label);
    markerEl.style.width = "20px";
    markerEl.style.height = "20px";
    markerEl.style.borderRadius = "9999px";
    markerEl.style.background = "#fdbc13";
    markerEl.style.border = "2px solid #ffffff";
    markerEl.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";

    new mapboxgl.Marker({ element: markerEl })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(label))
      .addTo(map);

    return () => map.remove();
  }, [latitude, longitude, label, zoom, mapboxToken]);

  if (!mapboxToken) {
    return (
      <div
        className={`text-body-md rounded-xl border border-border-muted bg-surface-container-low p-4 text-on-surface-variant ${className ?? ""}`}
      >
        Map unavailable (Mapbox not configured). Coordinates: {latitude}, {longitude}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`Map showing ${label}`}
      className={`h-64 w-full overflow-hidden rounded-xl border border-border-muted ${className ?? ""}`}
    />
  );
}
