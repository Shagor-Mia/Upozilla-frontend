import { Repeat, Store, Warehouse } from "lucide-react";
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
  const verified = session?.phoneVerified ?? false;

  const OPTIONS = [
    {
      href: "/sell/exchange",
      icon: Repeat,
      title: t("exchangeTitle"),
      description: t("exchangeDescription"),
    },
    {
      href: "/sell/marketplace",
      icon: Store,
      title: t("marketplaceTitle"),
      description: t("marketplaceDescription"),
    },
    {
      href: "/sell/shop",
      icon: Warehouse,
      title: t("shopTitle"),
      description: t("shopDescription"),
    },
  ];

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">
        {t("moderationNotice")}
      </p>
      <TrustGate locked={!verified} reason="verify" next="/sell" className="mt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OPTIONS.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <option.icon size={24} />
              </div>
              <h2 className="text-headline-md text-on-surface">{option.title}</h2>
              <p className="text-body-md mt-2 text-on-surface-variant">{option.description}</p>
            </Link>
          ))}
        </div>
      </TrustGate>
    </div>
  );
}
