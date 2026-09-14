import type { MetadataRoute } from "next";

import { getPublicSettings } from "@/lib/public-settings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site_url: siteUrl } = await getPublicSettings();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/admin/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
