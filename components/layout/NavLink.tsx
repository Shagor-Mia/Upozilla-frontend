"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { isNavItemActive } from "@/components/layout/nav-active";

export function NavLink({
  href,
  className,
  activeClassName,
  onClick,
  children,
}: {
  href: string;
  className: string;
  activeClassName: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, href);

  return (
    <Link href={href} onClick={onClick} className={active ? `${className} ${activeClassName}` : className}>
      {children}
    </Link>
  );
}
