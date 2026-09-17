import { Landmark } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { AuthNav } from "@/components/auth/AuthNav";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavLink } from "@/components/layout/NavLink";
import { PlacesNavDropdown } from "@/components/layout/PlacesNavDropdown";
import { getHospitals, getMarkets, getSchools, getUnions } from "@/lib/locations";
import { getPublicSettings } from "@/lib/public-settings";

export async function SiteHeader() {
  const [
    t,
    tCategory,
    tBusinessCategory,
    tSell,
    tMarkets,
    tHospitals,
    tSchools,
    { site_name },
    unions,
    markets,
    hospitals,
    schools,
  ] = await Promise.all([
    getTranslations("nav"),
    getTranslations("placesList.category"),
    getTranslations("businessPage.category"),
    getTranslations("sell"),
    getTranslations("marketsList"),
    getTranslations("hospitalsList"),
    getTranslations("schoolsList"),
    getPublicSettings(),
    getUnions(),
    getMarkets(),
    getHospitals(),
    getSchools(),
  ]);
  const placeCategories = [
    { href: "/places?category=tourist", label: tCategory("tourist") },
    { href: "/places?category=restaurant", label: tCategory("restaurant") },
    { href: "/places?category=park", label: tCategory("park") },
    { href: "/places?category=historical", label: tCategory("historical") },
    { href: "/places?category=religious", label: tCategory("religious") },
    { href: "/places?category=natural", label: tCategory("natural") },
    { href: "/places?category=shop", label: tCategory("shop") },
  ];
  const popularServices = [
    { href: "/popular-services?category=bank", label: tBusinessCategory("bank", { siteName: site_name }) },
    { href: "/popular-services?category=bkash_point", label: tBusinessCategory("bkash_point") },
    { href: "/popular-services?category=robi_point", label: tBusinessCategory("robi_point") },
    { href: "/popular-services?category=atm_booth", label: tBusinessCategory("atm_booth") },
    { href: "/popular-services?category=car_rental", label: tBusinessCategory("car_rental") },
    { href: "/popular-services?category=ekota_bus_service", label: tBusinessCategory("ekota_bus_service") },
    { href: "/popular-services?category=dhaka_homna_bus_service", label: tBusinessCategory("dhaka_homna_bus_service") },
  ];
  // "ইউনিয়ন" enumerates every union, and "হাট-বাজার" every market - both lists
  // are small (a handful of markets/unions per upazila) so listing them all in
  // the header is fine here, unlike places/services which have many entries
  // and use fixed category filters instead.
  const unionLinks = unions.map((union) => ({ href: `/unions/${union.id}`, label: union.name }));
  const marketLinks = [
    { href: "/markets", label: tMarkets("title") },
    ...markets.map((market) => ({ href: `/markets/${market.id}`, label: market.name })),
  ];
  const hospitalLinks = [
    { href: "/hospitals", label: tHospitals("title") },
    { href: "/hospitals/ambulance", label: t("ambulance") },
    ...hospitals.map((hospital) => ({ href: `/hospitals/${hospital.id}`, label: hospital.name })),
  ];
  const schoolLinks = [
    { href: "/schools", label: tSchools("title") },
    ...schools.map((school) => ({ href: `/schools/${school.id}`, label: school.name })),
  ];
  const navLinks = [
    { href: "/places", label: t("places"), children: placeCategories },
    { href: "/popular-services", label: t("services"), children: popularServices },
    { href: "/markets", label: t("bazaar"), children: marketLinks },
    { href: "/unions", label: t("unions"), children: unionLinks.length > 0 ? unionLinks : undefined },
    { href: "/marketplace", label: t("marketplace") },
    { href: "/hospitals", label: t("hospitals"), children: hospitalLinks },
    { href: "/shops", label: t("shops") },
    { href: "/schools", label: t("schools"), children: schoolLinks },
    { href: "/news", label: t("news") },
  ];

  return (
    <header className="fixed top-3 z-40 inset-x-4 mx-auto max-w-[1184px] rounded-2xl border border-border-muted/60 bg-surface/80 shadow-lg backdrop-blur-md md:inset-x-12">
      <div className="mx-auto flex h-16 max-w-[1184px] items-center justify-between gap-3 px-4 md:px-6">
        <Link href="/" className="-m-2 flex shrink-0 items-center gap-2 p-2 text-primary">
          <Landmark size={28} strokeWidth={1.75} />
          <span className="hidden text-headline-md font-bold xl:inline">{site_name}</span>
        </Link>
        {/* All 10 links at comfortable size/spacing/hover only have real room
            from `xl` (1280px) up - cramming them into `lg` (1024-1279px) forced
            either a tiny unreadable font or an internal scrollbar. Below `xl`,
            MobileNav's hamburger covers the same links instead. */}
        <nav className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) =>
            link.children ? (
              <PlacesNavDropdown
                key={link.href}
                href={link.href}
                label={link.label}
                items={link.children}
                addHref={
                  link.href === "/places"
                    ? "/sell/place"
                    : link.href === "/popular-services"
                      ? "/sell/business"
                      : link.href === "/schools"
                        ? "/sell/school"
                        : undefined
                }
                addLabel={
                  link.href === "/places"
                    ? tSell("placeTitle")
                    : link.href === "/popular-services"
                      ? tSell("businessTitle")
                      : link.href === "/schools"
                        ? tSell("schoolTitle")
                        : undefined
                }
              />
            ) : (
              <NavLink
                key={link.href}
                href={link.href}
                className="text-label-sm rounded-lg px-3 py-2 whitespace-nowrap text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                activeClassName="bg-surface-container text-primary"
              >
                {link.label}
              </NavLink>
            )
          )}
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
