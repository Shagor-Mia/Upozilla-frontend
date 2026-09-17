import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Listing photos are seller-supplied URLs (image CDN/upload service is a
    // later-phase account setup), so any https host must be allowed for now.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async redirects() {
    return [
      // Exchange is now a tab on /marketplace (?type=exchange), not its own
      // browsing route - keep old bookmarks/search-engine links working.
      { source: "/exchange", destination: "/marketplace?type=exchange", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
