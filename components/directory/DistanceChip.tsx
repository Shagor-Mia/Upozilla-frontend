import { MapPin } from "lucide-react";

import { formatDistanceKm } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Distance from the visitor, shown on directory cards in "near me" mode. */
export function DistanceChip({ km, className }: { km: number; className?: string }) {
  return (
    <span
      className={cn(
        "text-metadata inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 font-semibold text-on-surface-variant",
        className
      )}
    >
      <MapPin size={12} aria-hidden="true" />
      <span className="sr-only">Distance: </span>
      {formatDistanceKm(km)}
    </span>
  );
}
