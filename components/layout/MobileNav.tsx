"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { isNavItemActive } from "@/components/layout/nav-active";

interface NavLink {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
}

/**
 * Must render below exactly the breakpoint where SiteHeader's inline `<nav>`
 * turns on (`xl`, 1280px, see SiteHeader.tsx) - all 10 links only have room
 * for a comfortable font/padding/hover state at `xl` and up, so this covers
 * tablet and laptop widths (1024-1279px) too, not just phones. Closes itself
 * on navigation or route change.
 */
export function MobileNav({ links, labels }: { links: NavLink[]; labels: { openMenu: string; closeMenu: string } }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
    <Collapsible.Root open={open} onOpenChange={setOpen} className="xl:hidden">
      <button
        type="button"
        aria-label={open ? labels.closeMenu : labels.openMenu}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <Collapsible.Panel
        render={<nav aria-label={labels.openMenu} />}
        className="fixed inset-x-0 top-[78px] z-40 flex h-[var(--collapsible-panel-height)] max-h-[calc(100vh-78px)] flex-col gap-1 overflow-y-auto border-b border-muted bg-surface p-4 shadow-lg transition-[height] duration-150 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0"
      >
        {links.map((link) => (
          <div key={link.href}>
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              className={`text-label-md rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-container hover:text-primary ${
                isNavItemActive(pathname, link.href) ? "bg-surface-container text-primary" : "text-on-surface-variant"
              }`}
            >
              {link.label}
            </Link>
            {link.children && (
              <div className="ms-3 flex flex-col gap-1 border-s border-muted ps-3">
                {link.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setOpen(false)}
                    className={`text-label-sm rounded-lg px-3 py-2 transition-colors hover:bg-surface-container hover:text-primary ${
                      isNavItemActive(pathname, child.href) ? "bg-surface-container text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
