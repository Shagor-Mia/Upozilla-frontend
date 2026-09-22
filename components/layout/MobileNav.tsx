"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { isNavItemActive } from "@/components/layout/nav-active";

interface NavLink {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
  addHref?: string;
  addLabel?: string;
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
  // Which top-level item's children are expanded, by href - one at a time
  // (accordion), not "all children of all items always visible" like before.
  const [openSection, setOpenSection] = useState<string | null>(null);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Typed HTMLDivElement to match Collapsible.Panel's ref type (its default
  // render element) even though `render` below swaps it for a <nav> - the
  // actual tag doesn't matter here, only that it's a Node for .contains().
  const panelRef = useRef<HTMLDivElement>(null);

  // SiteHeader (and this component with it) lives in the root layout, so it
  // is never remounted between page navigations - only each link's own
  // onClick resets `open`. That only covers navigating via a link *inside*
  // this panel; any other navigation (a card/footer link elsewhere on the
  // page, browser back/forward, the logo) left the panel stuck open on
  // whatever page you landed on next. Reset on every pathname change to
  // cover all of those regardless of how the navigation happened - done
  // during render (not an effect) per React's "adjusting state when a prop
  // changes" pattern, since an effect here would just cause an extra render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
    setOpenSection(null);
  }

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

  // Desktop's dropdown is a Base UI Menu, which closes itself on any
  // outside click for free. Collapsible has no such behavior built in, so
  // without this, tapping content below the open panel (real content, not
  // a link inside the panel) left it stuck open indefinitely.
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  // The panel is a full-width overlay covering most of the viewport, so
  // (unlike desktop's small popover) leaving the page scrollable behind it
  // let the background content drift out from under the fixed panel while
  // scrolling inside it. Lock it while open, restore the previous value on
  // close/unmount.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="xl:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? labels.closeMenu : labels.openMenu}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <Collapsible.Panel
        ref={panelRef}
        render={<nav aria-label={labels.openMenu} />}
        className="fixed inset-x-0 top-[78px] z-40 flex h-[var(--collapsible-panel-height)] max-h-[calc(100vh-78px)] flex-col gap-1 overflow-y-auto border-b border-muted bg-surface p-4 shadow-lg transition-[height] duration-150 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0"
      >
        {links.map((link) =>
          link.children ? (
            <Collapsible.Root
              key={link.href}
              open={openSection === link.href}
              onOpenChange={(next) => setOpenSection(next ? link.href : null)}
            >
              {/* Label navigates (like PlacesNavDropdown on desktop); the
                  chevron is a separate hit-area that only toggles the
                  accordion - clicking the text itself never used to have
                  anywhere to go on mobile otherwise (places/popular-services
                  have no unfiltered "view all" entry among their children). */}
              <div
                className={`flex items-center rounded-lg transition-colors hover:bg-surface-container hover:text-primary ${
                  isNavItemActive(pathname, link.href) ? "bg-surface-container text-primary" : "text-on-surface-variant"
                }`}
              >
                <Link href={link.href} onClick={() => setOpen(false)} className="flex-1 py-2.5 pr-1 pl-3 text-label-md">
                  {link.label}
                </Link>
                <Collapsible.Trigger aria-label={link.label} className="group rounded-lg py-2.5 pr-3 pl-2">
                  <ChevronDown size={16} className="transition-transform group-data-[panel-open]:rotate-180" />
                </Collapsible.Trigger>
              </div>
              <Collapsible.Panel className="flex h-[var(--collapsible-panel-height)] flex-col gap-1 overflow-hidden transition-[height] duration-150 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                <div className="ms-3 flex flex-col gap-1 border-s border-muted ps-3 pt-1">
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setOpen(false)}
                      className={`text-label-sm rounded-lg px-3 py-2 transition-colors hover:bg-surface-container hover:text-primary ${
                        isNavItemActive(pathname, child.href)
                          ? "bg-surface-container text-primary"
                          : "text-on-surface-variant"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                  {link.addHref && link.addLabel && (
                    <>
                      <div className="my-1 border-t border-muted" />
                      <Link
                        href={link.addHref}
                        onClick={() => setOpen(false)}
                        className="text-label-sm rounded-lg px-3 py-2 font-medium text-primary transition-colors hover:bg-surface-container"
                      >
                        + {link.addLabel}
                      </Link>
                    </>
                  )}
                </div>
              </Collapsible.Panel>
            </Collapsible.Root>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`text-label-md rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-container hover:text-primary ${
                isNavItemActive(pathname, link.href) ? "bg-surface-container text-primary" : "text-on-surface-variant"
              }`}
            >
              {link.label}
            </Link>
          )
        )}
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}
