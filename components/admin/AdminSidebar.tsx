import {
  BadgeCheck,
  Building2,
  ClipboardList,
  HelpCircle,
  Hospital,
  LandmarkIcon,
  LayoutDashboard,
  Newspaper,
  Repeat,
  ScrollText,
  Settings,
  ShoppingBag,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { permissionsFor } from "@/lib/roles";
import { getSession } from "@/lib/session";
import type { Permission } from "@/types/api";

interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hidden unless the session's roles grant this permission (UX only - the
   * backend re-checks on every request). Omit for links every staff role sees. */
  permission?: Permission;
}

const LINKS: SidebarLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/places", label: "Places", icon: LandmarkIcon },
  { href: "/admin/services", label: "Services", icon: LandmarkIcon },
  { href: "/admin/hospitals", label: "Hospitals", icon: Hospital },
  { href: "/admin/markets", label: "Markets", icon: Store },
  { href: "/admin/business", label: "Businesses", icon: Building2 },
  { href: "/admin/businesses", label: "Verify businesses", icon: BadgeCheck, permission: "business.verify" },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/admin/exchange", label: "Exchange", icon: Repeat },
  { href: "/admin/moderation", label: "Moderation", icon: ClipboardList },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/audit", label: "Audit log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export interface AdminNavLink {
  href: string;
  label: string;
  icon: ReactNode;
}

/** Session-filtered nav links, shared by the desktop `<aside>` below and
 * `AdminMobileNav`'s drawer (via `app/admin/layout.tsx`) so both stay in
 * sync from one computation. Icons are pre-rendered here (rather than
 * passing the component reference) because a Server Component can hand a
 * Client Component rendered JSX, but not a bare function. */
export async function getAdminNavLinks(): Promise<AdminNavLink[]> {
  const session = await getSession();
  const granted = permissionsFor(session?.roles ?? []);
  return LINKS.filter((link) => !link.permission || granted.has(link.permission)).map((link) => ({
    href: link.href,
    label: link.label,
    icon: <link.icon size={20} />,
  }));
}

export function AdminSidebar({ links }: { links: AdminNavLink[] }) {
  return (
    <aside className="hidden w-64 flex-shrink-0 border-e border-border-muted bg-surface-container-lowest md:block">
      <nav className="sticky top-16 flex flex-col gap-1 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-label-sm flex items-center gap-3 rounded-lg px-3 py-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-admin-blue"
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
