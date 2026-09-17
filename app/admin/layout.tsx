import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminSidebar, getAdminNavLinks } from "@/components/admin/AdminSidebar";
import { InternalTopBar } from "@/components/layout/InternalTopBar";
import { getPublicSettings } from "@/lib/public-settings";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [links, { site_name }] = await Promise.all([getAdminNavLinks(), getPublicSettings()]);

  return (
    <div className="flex min-h-full flex-col">
      <InternalTopBar siteName={site_name} />
      {/* -4rem: `InternalTopBar` above is a real (non-fixed) h-16 element now,
          not the old floating public header this offset used to compensate
          for - it just needs to fill the rest of the viewport. */}
      <div className="flex min-h-[calc(100vh-4rem)] bg-surface-gray">
        <AdminSidebar links={links} />
        {/* min-w-0: without it this flex-1 column refuses to shrink below its
            content's natural width, so a wide table's own overflow-x-auto
            (components/ui/table.tsx) never engages - the whole page scrolls
            horizontally instead, worst on /admin/users where scrolling to
            reach Role/Status scrolls the Name column out of view (see the
            mobile-responsiveness-audit memory, finding #6). */}
        <div className="min-w-0 flex-1 p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between md:hidden">
            <span className="text-label-sm font-semibold text-on-surface-variant">Admin</span>
            <AdminMobileNav links={links} />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
