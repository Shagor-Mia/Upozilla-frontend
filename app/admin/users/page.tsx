import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminTable } from "@/components/admin/AdminTable";
import { HospitalPermissionToggle } from "@/components/admin/HospitalPermissionToggle";
import { SchoolPermissionToggle } from "@/components/admin/SchoolPermissionToggle";
import { ScopedRoles } from "@/components/admin/ScopedRoles";
import { UserRoleSelect } from "@/components/admin/UserRoleSelect";
import { UserStatusToggle } from "@/components/admin/UserStatusToggle";
import { StatusChip } from "@/components/listings/StatusChip";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { TableCell, TableRow } from "@/components/ui/table";
import { authApiGet } from "@/lib/admin-api";
import { getLocationOptions } from "@/lib/locations";
import { ROLE_LABELS, hasPermission, normalizeRole } from "@/lib/roles";
import { getSession } from "@/lib/session";
import type { AdminUser } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminUsers");
  return { title: t("users") };
}

export default async function AdminUsersPage() {
  const t = await getTranslations("adminUsers");
  const [session, users, locations] = await Promise.all([
    getSession(),
    authApiGet<AdminUser[]>("/admin/users"),
    getLocationOptions(),
  ]);
  const roles = session?.roles ?? [];
  const canManageRoles = hasPermission(roles, "roles.manage");
  const canManageUsers = hasPermission(roles, "users.manage");
  const headings = [
    t("name"),
    t("contact"),
    t("primaryRole"),
    t("scopedRoles"),
    t("status"),
    t("hospitalPermission"),
    t("schoolPermission"),
  ];

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("users")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">
        {t("description")}
      </p>

      <AdminTable headings={headings} isEmpty={users.length === 0} emptyMessage={t("noUsers")}>
        {users.map((user) => {
          const isSelf = user.id === session?.userId;
          return (
            <TableRow key={user.id}>
              <TableCell>
                {user.full_name}
                {isSelf && <span className="text-metadata ml-1 text-on-surface-variant">({t("you")})</span>}
              </TableCell>
              <TableCell className="text-on-surface-variant">
                <div>{user.email ?? "—"}</div>
                <div className="flex items-center gap-1">
                  {user.phone ?? "—"}
                  {user.phone_verified && <VerifiedBadge label={t("verified")} />}
                </div>
              </TableCell>
              <TableCell>
                {canManageRoles ? (
                  <UserRoleSelect userId={user.id} role={user.role} disabled={isSelf} />
                ) : (
                  <span className="text-body-md text-on-surface">{ROLE_LABELS[normalizeRole(user.role) ?? "user"]}</span>
                )}
              </TableCell>
              <TableCell>
                <ScopedRoles userId={user.id} roles={user.scoped_roles} locations={locations} canManage={canManageRoles} />
              </TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <StatusChip status={user.status} />
                  {canManageUsers && !isSelf && <UserStatusToggle userId={user.id} status={user.status} />}
                </div>
              </TableCell>
              <TableCell>
                {canManageUsers ? (
                  <HospitalPermissionToggle userId={user.id} granted={user.can_manage_hospital} />
                ) : (
                  <StatusChip
                    status={user.can_manage_hospital ? "active" : "suspended"}
                    label={user.can_manage_hospital ? t("granted") : t("notGranted")}
                  />
                )}
              </TableCell>
              <TableCell>
                {canManageUsers ? (
                  <SchoolPermissionToggle userId={user.id} granted={user.can_manage_school} />
                ) : (
                  <StatusChip
                    status={user.can_manage_school ? "active" : "suspended"}
                    label={user.can_manage_school ? t("granted") : t("notGranted")}
                  />
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </AdminTable>
    </div>
  );
}
