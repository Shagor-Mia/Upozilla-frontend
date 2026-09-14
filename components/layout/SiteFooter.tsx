import { getTranslations } from "next-intl/server";

import { getPublicSettings } from "@/lib/public-settings";

export async function SiteFooter() {
  const [t, { site_name }] = await Promise.all([getTranslations("footer"), getPublicSettings()]);
  const footerLinks = [
    { href: "/services", label: t("communitySupport") },
    { href: "/business", label: t("officialContact") },
    { href: "/privacy", label: t("privacyPolicy") },
    { href: "/terms", label: t("termsOfService") },
  ];

  return (
    <footer className="mt-auto border-t border-muted bg-surface-gray">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-8 px-4 py-12 md:flex-row md:items-start md:justify-between md:px-12">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <span className="text-headline-md font-bold text-on-surface">{site_name}</span>
          <p className="text-metadata text-on-surface-variant">
            {t("copyright", { year: new Date().getFullYear(), siteName: site_name })}
          </p>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 md:justify-end">
          {footerLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-body-md text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
