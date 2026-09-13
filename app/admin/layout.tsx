import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-surface-gray">
      <AdminSidebar />
      <div className="flex-1 p-6 md:p-8">{children}</div>
    </div>
  );
}
