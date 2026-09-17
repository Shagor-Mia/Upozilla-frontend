"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavItemActive } from "@/components/layout/nav-active";

interface SubLink {
  href: string;
  label: string;
}

/**
 * Built on Base UI's Menu primitive (already a dependency for Sheet/Drawer,
 * see sheet.tsx) instead of a hand-rolled useState + outside-click effect -
 * it gives us the open/close CSS transition via data-starting-style /
 * data-ending-style for free, plus escape/outside-click/focus handling.
 */
export function PlacesNavDropdown({
  href,
  label,
  items,
  addHref,
  addLabel,
}: {
  href: string;
  label: string;
  items: SubLink[];
  addHref?: string;
  addLabel?: string;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, href);

  return (
    <Menu.Root modal={false}>
      <div
        className={`text-label-sm flex items-center rounded-lg transition-colors hover:bg-surface-container hover:text-primary ${
          active ? "bg-surface-container text-primary" : "text-on-surface-variant"
        }`}
      >
        <Link href={href} className="rounded-lg py-2 pl-3 whitespace-nowrap">
          {label}
        </Link>
        <Menu.Trigger aria-label={label} className="group rounded-lg py-2 pr-2 pl-1">
          <ChevronDown size={14} className="transition-transform group-data-[popup-open]:rotate-180" />
        </Menu.Trigger>
      </div>

      <Menu.Portal>
        <Menu.Positioner className="z-40 outline-none" side="bottom" align="start" sideOffset={4}>
          <Menu.Popup className="origin-top min-w-[180px] rounded-xl border border-border-muted/60 bg-surface p-1.5 shadow-lg outline-none transition-[opacity,transform] duration-150 ease-out data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {items.map((item) => (
              <Menu.Item
                key={item.href}
                render={<Link href={item.href} />}
                className="text-label-sm block rounded-lg px-3 py-2 whitespace-nowrap text-on-surface-variant outline-none transition-colors hover:bg-surface-container hover:text-primary data-[highlighted]:bg-surface-container data-[highlighted]:text-primary"
              >
                {item.label}
              </Menu.Item>
            ))}
            {addHref && addLabel && (
              <>
                <div className="my-1 border-t border-border-muted" />
                <Menu.Item
                  render={<Link href={addHref} />}
                  className="text-label-sm block rounded-lg px-3 py-2 whitespace-nowrap font-medium text-primary outline-none transition-colors hover:bg-surface-container data-[highlighted]:bg-surface-container"
                >
                  + {addLabel}
                </Menu.Item>
              </>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
