"use client";

import { ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Listing photo with the DESIGN.md thumbnail radius and an explicit empty
 * state - sellers may post without photos, so never render a broken image.
 * Client Component (not async, `useTranslations` not `getTranslations`)
 * because several callers (MyListings, MyShops, ModerationQueue) are
 * themselves Client Components - a Server Component can't be imported and
 * rendered directly from inside one.
 */
export function ListingImage({
  src,
  alt,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  className,
}: {
  src: string | undefined;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const t = useTranslations("listingImage");
  return (
    <div className={cn("relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-container", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-outline">
          <ImageOff size={32} strokeWidth={1.5} />
          <span className="text-metadata">{t("noPhoto")}</span>
        </div>
      )}
    </div>
  );
}
