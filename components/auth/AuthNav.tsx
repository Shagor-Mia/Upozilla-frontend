"use client";

import { UserCircle, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { onAuthChanged } from "@/lib/auth-events";
import { isStaff } from "@/lib/roles";

interface Session {
  userId: string;
  tenantId: string | null;
  role: string | null;
  roles: string[];
  phoneVerified: boolean;
}

/** The signed-in action row (Admin/Sign out) - rendered twice below: inline
 * on `sm:`+ screens where it fits, and stacked inside a drawer below `sm`
 * where it used to just force the whole header, and therefore the whole
 * page, wider than the viewport on every mobile screen (see the
 * mobile-responsiveness-audit memory, finding #2 - measured up to 290px of
 * real page overflow at 375px width).
 *
 * Messages/Ask AI/Account/Sell used to be quick-access icons/buttons here
 * too, on every public page site-wide - but that's the internal account area
 * leaking into the marketing site's own header (2026-09-18 QA finding), and
 * all four already have their own links in the `(dashboard)` sidebar. Reach
 * them from there instead - `/sell` itself stays reachable to signed-out
 * visitors too via the Places/Popular services/Schools nav dropdowns' own
 * "add" links (see SiteHeader's addHref), so removing it here doesn't cut off
 * the public "list your business" funnel. */
function SignedInActions({ staff, stacked, onNavigate }: { staff: boolean; stacked?: boolean; onNavigate?: () => void }) {
  const rowClass = stacked ? "flex flex-col gap-1" : "flex items-center justify-end gap-1.5";

  return (
    <div className={rowClass} onClick={onNavigate}>
      {staff && (
        <Button
          render={<Link href="/admin" />}
          nativeButton={false}
          variant="ghost"
          size="sm"
          className={stacked ? "justify-start" : undefined}
        >
          Admin
        </Button>
      )}
      <LogoutButton />
    </div>
  );
}

export function AuthNav() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function fetchSession() {
      fetch("/api/session")
        .then((res) => res.json())
        .then((data: { session: Session | null }) => {
          if (!cancelled) setSession(data.session);
        })
        .catch(() => {
          if (!cancelled) setSession(null);
        });
    }

    fetchSession();
    const unsubscribe = onAuthChanged(fetchSession);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const staff = session ? isStaff(session.roles ?? [session.role]) : false;

  if (session === undefined) {
    // Reserve the signed-out row's width so the header doesn't jump once the
    // session check resolves.
    return <div className="min-w-[88px]" />;
  }

  if (!session) {
    // Same split as the signed-in branch below: inline on `sm:`+, collapsed
    // into this drawer's trigger below `sm`. Only "Sign in" is shown here by
    // design - Register is reached via the login page's own link instead.
    return (
      <>
        <div className="hidden items-center justify-end gap-1.5 sm:flex">
          <Button render={<Link href="/login" />} nativeButton={false} size="sm">
            Sign in
          </Button>
        </div>
        <Sheet open={menuOpen} onOpenChange={setMenuOpen} swipeDirection="right">
          <SheetTrigger
            aria-label="Account menu"
            className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary sm:hidden"
          >
            <UserCircle size={22} />
          </SheetTrigger>
          <SheetContent title="Account menu">
            <div className="mb-2 flex items-center justify-end">
              <SheetClose
                aria-label="Close menu"
                className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
              >
                <X size={22} />
              </SheetClose>
            </div>
            <div className="flex flex-col gap-1">
              <Button
                render={<Link href="/login" onClick={() => setMenuOpen(false)} />}
                nativeButton={false}
                className="justify-start"
              >
                Sign in
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <>
      <div className="hidden sm:block">
        <SignedInActions staff={staff} />
      </div>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen} swipeDirection="right">
        <SheetTrigger
          aria-label="Account menu"
          className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary sm:hidden"
        >
          <UserCircle size={22} />
        </SheetTrigger>
        <SheetContent title="Account menu">
          <div className="mb-2 flex items-center justify-end">
            <SheetClose
              aria-label="Close menu"
              className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            >
              <X size={22} />
            </SheetClose>
          </div>
          <SignedInActions staff={staff} stacked onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
