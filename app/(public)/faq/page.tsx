import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Faq } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("faqPage"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/faq" },
  };
}

/**
 * AEO: publishes the same FAQ content that previously only existed inside
 * the AskWidget chatbot (React state, never server-rendered - invisible to
 * crawlers and answer engines) as a real, indexable page with FAQPage
 * JSON-LD, so it's eligible for Google's Featured Snippets / rich results
 * and citable by AI answer engines (see upazila-seo-aeo-geo-aio-sxo-audit
 * memory, AEO finding). `<details>/<summary>` keeps it fully server-rendered
 * and usable with no client JS.
 */
export default async function FaqPage() {
  const [faqs, t] = await Promise.all([
    apiGet<Faq[]>("/faqs", { revalidateSeconds: 3600 }).catch(() => []),
    getTranslations("faqPage"),
  ]);

  const jsonLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-12">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <PageHero title={t("title")} description={t("description")} />
      {faqs.length === 0 ? (
        <p className="mt-8 text-body-md text-on-surface-variant">{t("emptyState")}</p>
      ) : (
        <div className="mt-8 divide-y divide-border-muted rounded-xl border border-border-muted bg-surface">
          {faqs.map((faq) => (
            <details key={faq.id} className="group px-5 py-4">
              <summary className="cursor-pointer list-none text-body-lg font-medium text-on-surface marker:content-none">
                {faq.question}
              </summary>
              <p className="mt-3 whitespace-pre-line text-body-md text-on-surface-variant">{faq.answer}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
