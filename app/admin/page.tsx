import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authApiGet } from "@/lib/admin-api";
import type { DashboardCounts } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminDashboard");
  return { title: t("dashboard") };
}

const COUNT_LABEL_KEYS: { key: keyof DashboardCounts; labelKey: string; href?: string }[] = [
  { key: "pending_moderation", labelKey: "pendingModeration", href: "/admin/moderation" },
  { key: "users", labelKey: "users", href: "/admin/users" },
  { key: "marketplace_products", labelKey: "marketplaceProducts", href: "/admin/marketplace" },
  { key: "exchange_listings", labelKey: "exchangeListings", href: "/admin/exchange" },
  { key: "places", labelKey: "places", href: "/admin/places" },
  { key: "services", labelKey: "services", href: "/admin/services" },
  { key: "hospitals", labelKey: "hospitals", href: "/admin/hospitals" },
  { key: "markets", labelKey: "markets", href: "/admin/markets" },
  { key: "businesses", labelKey: "businesses", href: "/admin/business" },
  { key: "news_articles", labelKey: "newsArticles", href: "/admin/news" },
];

export default async function AdminDashboardPage() {
  const t = await getTranslations("adminDashboard");
  const counts = await authApiGet<DashboardCounts>("/admin/dashboard");

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("dashboard")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">
        {t("overview")}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {COUNT_LABEL_KEYS.map(({ key, labelKey, href }) => {
          const card = (
            <Card className="h-full shadow-card transition-shadow hover:shadow-md">
              <CardHeader>
                {/* No tracking-wider + break-words: at 320px in this 2-col
                    grid, the extra letter-spacing pushed labels like
                    "PENDING MODERATION" wide enough to clip against the
                    card's own overflow-hidden instead of wrapping (see the
                    mobile-responsiveness-audit memory, finding #12). */}
                <CardTitle className="text-metadata font-semibold uppercase break-words text-on-surface-variant">
                  {t(labelKey)}
                </CardTitle>
              </CardHeader>
              <CardContent
                className={`text-display-hero-mobile ${
                  key === "pending_moderation" && counts[key] > 0 ? "text-warning" : "text-admin-blue"
                }`}
              >
                {counts[key]}
              </CardContent>
            </Card>
          );
          return href ? (
            <Link key={key} href={href}>
              {card}
            </Link>
          ) : (
            <div key={key}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
