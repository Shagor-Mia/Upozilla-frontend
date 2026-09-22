import { PublicSiteChrome } from "@/components/layout/PublicSiteChrome";

export default function AuthGroupLayout({ children }: LayoutProps<"/">) {
  return <PublicSiteChrome>{children}</PublicSiteChrome>;
}
