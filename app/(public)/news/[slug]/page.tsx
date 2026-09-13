import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ApiNotFoundError, apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { NewsArticleDetail } from "@/types/api";

async function getArticle(slug: string): Promise<NewsArticleDetail | null> {
  try {
    return await apiGet<NewsArticleDetail>(`/news/${slug}`);
  } catch (error) {
    if (error instanceof ApiNotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata(props: PageProps<"/news/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticle(slug);
  if (!article) return {};

  const description = article.summary ?? `${article.title} — ${config.siteName}`;

  return {
    title: article.title,
    description,
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: {
      title: article.title,
      description,
      type: "article",
      images: article.image ? [article.image] : undefined,
      publishedTime: article.published_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
    },
  };
}

export default async function NewsDetailPage(props: PageProps<"/news/[slug]">) {
  const { slug } = await props.params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary ?? undefined,
    image: article.image ?? undefined,
    datePublished: article.published_at ?? undefined,
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 md:px-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="font-bengali text-headline-lg text-on-surface">{article.title}</h1>
      {article.published_at && (
        <p className="mt-2 text-metadata text-on-surface-variant">
          {new Date(article.published_at).toLocaleDateString()}
        </p>
      )}

      {article.body ? (
        <div className="font-bengali mt-6 whitespace-pre-line text-body-md text-on-surface">
          {article.body}
        </div>
      ) : (
        <>
          {article.summary && (
            <p className="font-bengali mt-6 text-body-md text-on-surface-variant">
              {article.summary}
            </p>
          )}
          {/* Section 11 legal note: never republish full text from an unlicensed
              source — link out to the original for the full article. */}
          {article.original_url && (
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-label-sm text-primary hover:underline"
            >
              Read full article at the source →
            </a>
          )}
        </>
      )}
    </article>
  );
}
