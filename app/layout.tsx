import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic, Noto_Sans_Bengali } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { ConsentBanner } from "@/components/analytics/ConsentBanner";
import { GTMContainer } from "@/components/analytics/GTMContainer";
import { AskWidget } from "@/components/ai/AskWidget";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PublicSettingsProvider } from "@/components/settings/PublicSettingsProvider";
import { config } from "@/lib/config";
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

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: config.siteName,
    template: `%s | ${config.siteName}`,
  },
  description: `${config.siteName} — places, government services, weekly bazaar, hospitals, local business directory, and news, all in one place.`,
};

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
        <NextIntlClientProvider>
          <PublicSettingsProvider value={publicSettings}>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <ConsentBanner />
            <GTMContainer />
            <AskWidget />
          </PublicSettingsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
