"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminNavLink {
  href: string;
  label: string;
  icon: ReactNode;
}

/** Hamburger trigger + off-canvas drawer for the admin sidebar's nav. Shown
 * only below `md` - the desktop `<aside>` (`AdminSidebar.tsx`) covers `md:`
 * and up. Before this, the whole 15-link sidebar was simply `hidden` below
 * `md` with no way to reach any other admin section on a phone - combined
 * with the same gap in the public header nav, a staff user signing in on a
 * phone had zero on-screen way to navigate at all (see the
 * mobile-responsiveness-audit memory, finding #1). */
export function AdminMobileNav({ links }: { links: AdminNavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen} swipeDirection="right">
      <SheetTrigger
        aria-label="Open admin menu"
        className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-admin-blue"
      >
        <Menu size={22} />
      </SheetTrigger>
      <SheetContent title="Admin navigation menu">
        <div className="mb-2 flex items-center justify-end">
          <SheetClose
            aria-label="Close menu"
            className="flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-admin-blue"
          >
            <X size={22} />
          </SheetClose>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Admin sections">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-label-sm flex items-center gap-3 rounded-lg px-3 py-3 text-on-surface transition-colors hover:bg-surface-container hover:text-admin-blue"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
