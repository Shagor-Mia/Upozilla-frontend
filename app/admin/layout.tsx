import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminSidebar, getAdminNavLinks } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const links = await getAdminNavLinks();

  return (
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
  );
}
