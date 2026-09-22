import { FileSignature, Heart, MapPin, MessageSquare, Package, Sparkles, Tag, UserCircle } from "lucide-react";
import Link from "next/link";

import { InternalTopBar } from "@/components/layout/InternalTopBar";
import { getPublicSettings } from "@/lib/public-settings";

const LINKS = [
  { href: "/account", label: "Account", icon: UserCircle },
  { href: "/account/listings", label: "My listings", icon: Package },
  { href: "/account/places", label: "My places", icon: MapPin },
  { href: "/account/favorites", label: "Saved", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/contracts", label: "Contracts", icon: FileSignature },
  { href: "/ask", label: "Ask AI", icon: Sparkles },
  { href: "/sell", label: "Sell", icon: Tag },
];

/** Section 7 `(dashboard)` group: seller dashboard, listings, messages. Routes
 * here are cookie-gated by proxy.ts and render dynamically. Its own
 * `InternalTopBar` replaces the public marketing nav the root layout used to
 * apply everywhere - same fix as `/admin` (see PublicSiteChrome). */
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { site_name } = await getPublicSettings();

  return (
    <div className="flex min-h-full flex-col">
      <InternalTopBar siteName={site_name} />
      <div className="mx-auto flex max-w-[1280px] gap-8 px-4 py-8 md:px-12">
        <aside className="hidden w-56 shrink-0 md:block">
          {/* top-20: 64px InternalTopBar + this column's own 32px (py-8) top
              padding, so the sticky nav lines up with the content beside it
              instead of hugging the very top of the viewport. */}
          <nav className="sticky top-20 flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-label-sm flex items-center gap-3 rounded-lg px-3 py-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                <link.icon size={20} />
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <nav className="mb-6 flex gap-2 overflow-x-auto md:hidden" aria-label="Account sections">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                // pointer-coarse:py-3 brings this to a 44px touch target on
                // phones/tablets (was ~34px) - see the
                // mobile-responsiveness-audit memory, finding #15.
                className="text-label-sm shrink-0 rounded-full border border-border-muted bg-surface-container-lowest px-4 py-1.5 pointer-coarse:py-3 text-on-surface-variant"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </div>
  );
}
