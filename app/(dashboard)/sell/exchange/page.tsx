import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ListingForm } from "@/components/listings/ListingForm";
import { TrustGate } from "@/components/listings/TrustGate";
import { getCategories } from "@/lib/listings";
import { getLocationOptions } from "@/lib/locations";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellExchange");
  return { title: t("heading") };
}

export default async function SellExchangePage() {
  const t = await getTranslations("sellExchange");
  const [session, categories, locations] = await Promise.all([getSession(), getCategories(), getLocationOptions()]);
  // Anyone can open and fill this form signed out - only submitting prompts
  // sign-in, in place. An already-signed-in but unverified account is the one
  // case pre-locked here.
  const gateReason = session && !session.phoneVerified ? "verify" : null;

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">
        {t("description")}
      </p>
      <TrustGate locked={gateReason !== null} reason={gateReason ?? "signin"} className="mt-6">
        <div className="max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
          <ListingForm listingType="exchange" categories={categories} locations={locations} />
        </div>
      </TrustGate>
    </div>
  );
}
