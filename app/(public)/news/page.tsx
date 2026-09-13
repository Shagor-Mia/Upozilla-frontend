import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { NewsArticle, Paginated } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("newsList");
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: config.siteName }),
  };
}

export default async function NewsPage() {
  const t = await getTranslations("newsList");
  const { items: articles } = await apiGet<Paginated<NewsArticle>>("/news");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero
        title={t("title")}
        description={t("description")}
      />

      {articles.length === 0 ? (
        <p className="mt-8 text-body-md text-on-surface-variant">{t("emptyState")}</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/news/${article.slug}`}>
              <Card className="h-full shadow-card transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="font-bengali text-headline-md">{article.title}</CardTitle>
                  {article.summary && (
                    <p className="font-bengali line-clamp-3 text-body-md text-on-surface-variant">
                      {article.summary}
                    </p>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
