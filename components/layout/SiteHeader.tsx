import { Landmark } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { AuthNav } from "@/components/auth/AuthNav";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { config } from "@/lib/config";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const navLinks = [
    { href: "/places", label: t("places") },
    { href: "/services", label: t("services") },
    { href: "/markets", label: t("bazaar") },
    { href: "/unions", label: t("unions") },
    { href: "/marketplace", label: t("marketplace") },
    { href: "/exchange", label: t("exchange") },
    { href: "/hospitals", label: t("hospitals") },
    { href: "/business", label: t("business") },
    { href: "/news", label: t("news") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-muted bg-surface shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-4 md:px-12">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-primary">
          <Landmark size={28} strokeWidth={1.75} />
          <span className="text-headline-md font-bold">{config.siteName}</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-label-sm whitespace-nowrap text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
