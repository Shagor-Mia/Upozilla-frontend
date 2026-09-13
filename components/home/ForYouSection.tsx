"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForYouListingCard } from "@/components/home/ForYouListingCard";
import { clientApi } from "@/lib/client-api";
import type { Listing, RecommendationsResponse } from "@/types/api";

/** Section 17 Phase 4 "personalized recommendations" (location + trending -
 * Section 23.4). Fetched client-side through the `/api/backend` proxy (not
 * the server-side `apiGet` the rest of this page uses) since personalizing
 * for a logged-in viewer needs the httpOnly-cookie token; works fine
 * anonymously too. Renders nothing while loading or on error/empty so a
 * slow/failed personalization call never breaks the homepage. */
export function ForYouSection() {
  const t = useTranslations("home");
  const [data, setData] = useState<RecommendationsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    clientApi
      .get<RecommendationsResponse>("recommendations")
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch(() => {
        /* supplementary section - fail silently */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;

  const listings: Listing[] = [...data.trending_products, ...data.trending_exchange];
  if (listings.length === 0 && data.hospitals.length === 0) return null;

  return (
    <section className="border-b border-muted py-16">
      <div className="mx-auto max-w-[1280px] px-4 md:px-12">
        <div className="mb-6">
          <h2 className="text-headline-lg text-on-surface">{t("forYou")}</h2>
          {data.widened_to_upazila && (
            <p className="text-metadata mt-1 text-on-surface-variant">{t("forYouWidened")}</p>
          )}
        </div>

        {listings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-label-sm mb-3 text-on-surface-variant">{t("forYouTrending")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing, index) => (
                <ForYouListingCard key={listing.id} listing={listing} priority={index < 4} />
              ))}
            </div>
          </div>
        )}

        {data.hospitals.length > 0 && (
          <div>
            <h3 className="text-label-sm mb-3 text-on-surface-variant">{t("forYouHospitals")}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.hospitals.map((hospital) => (
                <Card key={hospital.id} className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-headline-md">{hospital.name}</CardTitle>
                  </CardHeader>
                  {hospital.address && (
                    <CardContent className="text-body-md text-on-surface-variant">{hospital.address}</CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
