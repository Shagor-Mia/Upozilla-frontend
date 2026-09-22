import { Landmark } from "lucide-react";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/LogoutButton";

/** Lean top bar for internal tools (`/admin`, the `(dashboard)` account/seller
 * area): logo, a way back to the public site, and sign out. Deliberately
 * does not reuse `SiteHeader` - that's the full consumer marketing nav
 * (স্থান/সেবা/হাসপাতাল/... plus its own dropdowns), which has no place inside
 * an internal panel. Sticky (not fixed) so it takes up real layout space and
 * the sidebar below it doesn't need a manual top-offset hack. */
export function InternalTopBar({ siteName }: { siteName: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border-muted bg-surface px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2 text-primary">
        <Landmark size={24} strokeWidth={1.75} />
        <span className="text-label-lg font-bold">{siteName}</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href="/"
          className="text-label-sm rounded-lg px-3 py-2 whitespace-nowrap text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
        >
          Visit site
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
