"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

/**
 * SiteHeader's `<nav>` was `hidden lg:flex` with no hamburger fallback at all,
 * so every link (Places/Services/Markets/Marketplace/Exchange/Hospitals/
 * Business/News/Unions) was unreachable from the header below 1024px - the
 * majority of this site's traffic (see upazila-mobile-responsiveness-audit
 * and upazila-seo-aeo-geo-aio-sxo-audit memories, SXO finding). This renders
 * only below `lg` and closes itself on navigation or route change.
 */
export function MobileNav({ links, labels }: { links: NavLink[]; labels: { openMenu: string; closeMenu: string } }) {
  const [open, setOpen] = useState(false);

  // Safety net if a link's onClick somehow doesn't fire (e.g. middle-click
  // opening a new tab shouldn't leave the panel stuck open in this tab).
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? labels.closeMenu : labels.openMenu}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <nav
          aria-label={labels.openMenu}
          className="absolute inset-x-0 top-16 z-40 flex flex-col gap-1 border-b border-muted bg-surface p-4 shadow-lg"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-label-md rounded-lg px-3 py-2.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
