export function isNavItemActive(pathname: string, href: string): boolean {
  const hrefPath = href.split("?")[0];
  if (hrefPath === "/") return pathname === "/";
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}
