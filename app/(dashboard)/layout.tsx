import { Heart, MessageSquare, Package, Sparkles, Tag, UserCircle } from "lucide-react";
import Link from "next/link";

const LINKS = [
  { href: "/account", label: "Account", icon: UserCircle },
  { href: "/account/listings", label: "My listings", icon: Package },
  { href: "/account/favorites", label: "Saved", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/ask", label: "Ask AI", icon: Sparkles },
  { href: "/sell", label: "Sell", icon: Tag },
];

/** Section 7 `(dashboard)` group: seller dashboard, listings, messages. Routes
 * here are cookie-gated by proxy.ts and render dynamically. */
export default function DashboardLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex max-w-[1280px] gap-8 px-4 py-8 md:px-12">
      <aside className="hidden w-56 shrink-0 md:block">
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
              className="text-label-sm shrink-0 rounded-full border border-border-muted bg-surface-container-lowest px-4 py-1.5 text-on-surface-variant"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
