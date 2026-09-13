"use client";

import { LoaderCircle, LocateFixed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NEAR_ME_RADII, type NearMeRadius, type NearMeStatus } from "@/lib/use-near-me";
import { cn } from "@/lib/utils";

interface NearMeToggleProps {
  status: NearMeStatus;
  radius: NearMeRadius;
  error: string | null;
  onActivate: () => void;
  onRadiusChange: (radius: NearMeRadius) => void;
  onReset: () => void;
  className?: string;
}

function statusMessage(status: NearMeStatus, radius: NearMeRadius, error: string | null): string | null {
  switch (status) {
    case "locating":
      return "Waiting for your location - allow access when your browser asks.";
    case "loading":
      return "Finding what's nearby…";
    case "ready":
      return `Showing results within ${radius} km of you, nearest first.`;
    case "denied":
      return "Location access was denied. Allow location for this site in your browser settings, then try again.";
    case "unsupported":
      return "Your browser doesn't support location, so \"Near me\" isn't available here.";
    case "error":
      return error ?? "Something went wrong. Please try again.";
    default:
      return null;
  }
}

/** "Everything" / "Near me" segmented control plus a radius picker once the
 * visitor has shared their position. Purely presentational - state lives in
 * `useNearMe` so the page's list component can swap its items. */
export function NearMeToggle({ status, radius, error, onActivate, onRadiusChange, onReset, className }: NearMeToggleProps) {
  const nearMeActive = status === "ready" || status === "loading";
  const busy = status === "locating" || status === "loading";
  const failed = status === "denied" || status === "unsupported" || status === "error";
  const message = statusMessage(status, radius, error);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by distance">
        <Button
          type="button"
          size="sm"
          variant={nearMeActive ? "outline" : "default"}
          aria-pressed={!nearMeActive}
          onClick={onReset}
        >
          Everything
        </Button>
        <Button
          type="button"
          size="sm"
          variant={nearMeActive ? "default" : "outline"}
          aria-pressed={nearMeActive}
          disabled={busy || status === "unsupported"}
          onClick={onActivate}
        >
          {status === "locating" ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed data-icon="inline-start" aria-hidden="true" />
          )}
          {status === "locating" ? "Locating…" : failed ? "Try again" : "Near me"}
        </Button>

        {nearMeActive && (
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Search radius">
            {NEAR_ME_RADII.map((option) => {
              const selected = option === radius;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={busy}
                  onClick={() => onRadiusChange(option)}
                  className={cn(
                    "text-label-sm rounded-full px-3 py-1 transition-colors disabled:opacity-60",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  {option} km
                </button>
              );
            })}
          </div>
        )}
      </div>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className={cn("text-metadata", failed ? "text-error" : "text-on-surface-variant")}
        >
          {message}
        </p>
      )}
    </div>
  );
}
