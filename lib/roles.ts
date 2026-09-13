import type { Permission, Role } from "@/types/api";

/** Mirror of backend/app/core/rbac.py ROLE_PERMISSIONS - UX gating only. The
 * backend re-checks permissions on every request (Section 12). */
const ALL: Permission[] = [
  "dashboard.view",
  "content.manage",
  "news.manage",
  "marketplace.moderate",
  "business.verify",
  "users.manage",
  "roles.manage",
  "support.view",
  "settings.manage",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  upazila_admin: ALL.filter((p) => p !== "roles.manage" && p !== "settings.manage"),
  union_admin: ["dashboard.view", "content.manage", "marketplace.moderate", "business.verify", "support.view"],
  content_editor: ["dashboard.view", "content.manage"],
  news_editor: ["dashboard.view", "news.manage"],
  marketplace_moderator: ["dashboard.view", "marketplace.moderate"],
  business_verifier: ["dashboard.view", "business.verify"],
  support_staff: ["dashboard.view", "support.view"],
  user: [],
};

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  upazila_admin: "Upazila admin",
  union_admin: "Union admin",
  content_editor: "Content editor",
  news_editor: "News editor",
  marketplace_moderator: "Marketplace moderator",
  business_verifier: "Business verifier",
  support_staff: "Support staff",
  user: "User",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];

// Tokens minted before the Phase 2 migration may still carry the Phase 1 names.
const LEGACY_ALIASES: Record<string, Role> = { admin: "super_admin", editor: "content_editor" };

export function normalizeRole(name: string | null | undefined): Role | null {
  if (!name) return null;
  if (name in LEGACY_ALIASES) return LEGACY_ALIASES[name];
  return name in ROLE_PERMISSIONS ? (name as Role) : null;
}

export function permissionsFor(roles: readonly (string | null)[]): Set<Permission> {
  const granted = new Set<Permission>();
  for (const name of roles) {
    const role = normalizeRole(name);
    if (role) ROLE_PERMISSIONS[role].forEach((p) => granted.add(p));
  }
  return granted;
}

export function hasPermission(roles: readonly (string | null)[], permission: Permission): boolean {
  return permissionsFor(roles).has(permission);
}

export function isStaff(roles: readonly (string | null)[]): boolean {
  return roles.some((name) => {
    const role = normalizeRole(name);
    return role !== null && role !== "user";
  });
}
