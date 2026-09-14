import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Noto_Sans_Bengali } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { GTMContainer } from "@/components/analytics/GTMContainer";
import { AskWidget } from "@/components/ai/AskWidget";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PublicSettingsProvider } from "@/components/settings/PublicSettingsProvider";
import { getPublicSettings } from "@/lib/public-settings";

import "./globals.css";

// Section 15: self-hosted via next/font (not a runtime Google Fonts <link>), swap
// display so the Bangla face doesn't block first paint on the landing hero.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

// `site_name`/`site_url`/`site_description` are admin-editable (Admin >
// Settings > Site identity), DB-backed with an env fallback - same pattern as
// gtm_id/mapbox_token (see upazila-seo-aeo-geo-aio-sxo-audit memory). Both
// this and RootLayout below call getPublicSettings(); Next dedupes identical
// fetches within one request, so it's a single network round trip.
export async function generateMetadata(): Promise<Metadata> {
  const { site_name, site_url, site_description } = await getPublicSettings();
  const description =
    site_description ||
    `${site_name} — places, government services, weekly bazaar, hospitals, local business directory, and news, all in one place.`;

  return {
    metadataBase: new URL(site_url),
    title: {
      default: site_name,
      template: `%s | ${site_name}`,
    },
    description,
  };
}

// GEO/AIO: a single sitewide Organization+WebSite entity so AI/answer engines
// have one canonical thing to anchor citations to, instead of only ever
// seeing fragments of individual listing schema (see
// upazila-seo-aeo-geo-aio-sxo-audit memory, GEO finding #1).
function organizationJsonLd(siteName: string, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: siteName,
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: ["bn", "en", "ar"],
      },
    ],
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Integration keys live in the admin CMS (with env fallback) - fetched once
  // here, ISR-cached, and handed to the client islands that need them.
  const publicSettings = await getPublicSettings();
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${notoSansBengali.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd(publicSettings.site_name, publicSettings.site_url)),
          }}
        />
        <NextIntlClientProvider>
          <PublicSettingsProvider value={publicSettings}>
            <AuthModalProvider>
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
              <ConsentBanner />
              <GTMContainer />
              <AskWidget />
            </AuthModalProvider>
          </PublicSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
