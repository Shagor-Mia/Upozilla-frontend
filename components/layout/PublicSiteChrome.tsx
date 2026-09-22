import type { ReactNode } from "react";

import { AskWidget } from "@/components/ai/AskWidget";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** The marketing chrome (floating nav, footer, "Ask AI" bubble) shared by
 * every visitor-facing page - `(public)` and `(auth)`. Internal tools
 * (`/admin`, the `(dashboard)` account/seller area) render `InternalTopBar`
 * instead: a full copy of this consumer nav on top of an admin panel reads as
 * unfinished/unprofessional and has no functional purpose there (see the
 * 2026-09-18 QA finding - the public header's "স্থান/হাসপাতাল/স্কুল/..." links
 * and footer's privacy/terms links were showing above the admin dashboard's
 * own sidebar). This used to live directly in the root layout, applied to
 * every route with no way for admin/dashboard to opt out. */
export function PublicSiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pt-[78px]">{children}</main>
      <SiteFooter />
      <AskWidget />
    </>
  );
}
