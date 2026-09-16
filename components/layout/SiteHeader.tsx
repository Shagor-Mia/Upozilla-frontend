import { Landmark } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { AuthNav } from "@/components/auth/AuthNav";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MobileNav } from "@/components/layout/MobileNav";
import { getPublicSettings } from "@/lib/public-settings";

export async function SiteHeader() {
  const [t, { site_name }] = await Promise.all([getTranslations("nav"), getPublicSettings()]);
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
    { href: "/faq", label: t("faq") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-muted bg-surface shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-primary">
          <Landmark size={28} strokeWidth={1.75} />
          {/* Full wordmark only from `xl` (1280px) up - between that and `lg`
              (1024px, where the nav below turns on) it's icon-only, because
              live measurement showed the wordmark alone (~280px) was the
              single biggest fixed cost in the row, bigger than the nav or the
              language/auth cluster. Freeing that space (plus the tighter
              gap/padding/font-size below) is what lets all 10 nav links fit
              inline starting at 1024px instead of needing a hamburger on
              every laptop screen. IMPORTANT: this row is capped at
              `max-w-[1280px]`, so past a 1280px viewport it never gets any
              wider - there is no larger breakpoint where "loosening back up"
              the gap/padding/font-size below would have any real extra room
              to spend; every px added back to those is a px taken from the
              nav with nothing gained. (Verified live: adding `2xl:` versions
              of those back re-created the exact same internal-scrollbar
              overflow this whole fix is for.) They must stay at their tight
              values unconditionally from `lg` up. */}
          <span className="hidden text-headline-md font-bold xl:inline">{site_name}</span>
        </Link>
        {/* Live-measured (bn/en/ar) with this tight gap/padding/font-size held
            constant everywhere from `lg` up (wordmark included from `xl`):
            English, the widest locale, always kept at least a 34px real
            margin. `min-w-0` + `overflow-x-auto` stay as a defensive fallback
            only: if a future label edit erodes that margin, the nav scrolls
            internally instead of forcing the header (and the whole page)
            wider than the viewport again, the way the untamed version of
            this row did. */}
        <nav className="hidden min-w-0 items-center gap-2.5 overflow-x-auto lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] leading-5 font-medium whitespace-nowrap text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <AuthNav />
          <MobileNav links={navLinks} labels={{ openMenu: t("openMenu"), closeMenu: t("closeMenu") }} />
        </div>
      </div>
    </header>
  );
}
