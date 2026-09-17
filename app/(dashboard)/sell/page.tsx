import { Landmark, MapPin, Repeat, Store, Warehouse } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TrustGate } from "@/components/listings/TrustGate";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sell");
  return { title: t("heading") };
}

export default async function SellPage() {
  const t = await getTranslations("sell");
  const session = await getSession();
  // Anonymous visitors can browse this page freely; only an already-signed-in
  // but unverified account gets pre-locked here (a sign-in prompt appears
  // in place when they actually try to choose an option, not before).
  const verifyGateReason: "verify" | "signin" = session && !session.phoneVerified ? "verify" : "signin";

  const OPTIONS: { href: string; icon: typeof Repeat; title: string; description: string; locked: boolean; reason: "verify" | "signin" }[] = [
    {
      href: "/sell/exchange",
      icon: Repeat,
      title: t("exchangeTitle"),
      description: t("exchangeDescription"),
      // A place needs no phone verification (product decision), just sign-in -
      // gated separately below instead of joining this phone-verify gate.
      locked: verifyGateReason === "verify",
      reason: verifyGateReason,
    },
    {
      href: "/sell/marketplace",
      icon: Store,
      title: t("marketplaceTitle"),
      description: t("marketplaceDescription"),
      locked: verifyGateReason === "verify",
      reason: verifyGateReason,
    },
    {
      href: "/sell/shop",
      icon: Warehouse,
      title: t("shopTitle"),
      description: t("shopDescription"),
      locked: verifyGateReason === "verify",
      reason: verifyGateReason,
    },
    {
      href: "/sell/place",
      icon: MapPin,
      title: t("placeTitle"),
      description: t("placeDescription"),
      locked: !session,
      reason: "signin",
    },
    {
      href: "/sell/business",
      icon: Landmark,
      title: t("businessTitle"),
      description: t("businessDescription"),
      // No phone verification, same as a place - just sign-in.
      locked: !session,
      reason: "signin",
    },
  ];

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">
        {t("moderationNotice")}
      </p>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <TrustGate key={option.href} locked={option.locked} reason={option.reason}>
            <Link
              href={option.href}
              className="block rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <option.icon size={24} />
              </div>
              <h2 className="text-headline-md text-on-surface">{option.title}</h2>
              <p className="text-body-md mt-2 text-on-surface-variant">{option.description}</p>
            </Link>
          </TrustGate>
        ))}
      </div>
    </div>
  );
}
