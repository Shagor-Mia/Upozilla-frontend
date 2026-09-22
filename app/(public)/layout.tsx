import { PublicSiteChrome } from "@/components/layout/PublicSiteChrome";

export default function PublicGroupLayout({ children }: LayoutProps<"/">) {
  return <PublicSiteChrome>{children}</PublicSiteChrome>;
}
