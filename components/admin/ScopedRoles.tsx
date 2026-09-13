"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { selectClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/roles";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { ScopedRole } from "@/types/api";

interface Option {
  value: string;
  label: string;
}

/** Section 12: additional roles scoped to a location subtree, e.g. a
 * union_admin or marketplace_moderator limited to one union. */
export function ScopedRoles({
  userId,
  roles,
  locations,
  canManage,
}: {
  userId: string;
  roles: ScopedRole[];
  locations: Option[];
  canManage: boolean;
}) {
  const t = useTranslations("scopedRoles");
  const [adding, setAdding] = useState(false);
  const { run, pending, error } = useApiMutation(t("failed"));

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(
      () =>
        clientApi.post(`admin/users/${userId}/roles`, {
          role: formData.get("role"),
          scope_location_id: String(formData.get("scope_location_id") ?? "") || null,
        }),
      { refresh: true, onSuccess: () => setAdding(false) }
    );
  }

  async function remove(userRoleId: string) {
    await run(() => clientApi.delete(`admin/users/${userId}/roles/${userRoleId}`), { refresh: true });
  }

  return (
    <div className="space-y-1">
      <ul className="flex flex-wrap gap-1">
        {roles.map((scoped) => (
          <li
            key={scoped.id}
            className="text-metadata inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-on-surface"
          >
            {ROLE_LABELS[scoped.role]}
            {scoped.scope_location_name ? ` @ ${scoped.scope_location_name}` : ""}
            {canManage && (
              <button
                type="button"
                aria-label={t("removeRole", { role: ROLE_LABELS[scoped.role] })}
                disabled={Boolean(pending)}
                onClick={() => remove(scoped.id)}
                className="rounded-full hover:text-error"
              >
                <X size={12} />
              </button>
            )}
          </li>
        ))}
        {roles.length === 0 && <li className="text-metadata text-on-surface-variant">—</li>}
      </ul>
      {canManage && !adding && (
        <button type="button" onClick={() => setAdding(true)} className="text-metadata text-admin-blue hover:underline">
          {t("addScopedRole")}
        </button>
      )}
      {adding && (
        <form onSubmit={add} className="flex flex-wrap items-center gap-1">
          <select name="role" required defaultValue="" aria-label={t("role")} className={`${selectClass} w-auto px-2 py-1`}>
            <option value="" disabled>
              {t("rolePlaceholder")}
            </option>
            {ALL_ROLES.filter((r) => r !== "user").map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <select name="scope_location_id" defaultValue="" aria-label={t("scope")} className={`${selectClass} w-auto px-2 py-1`}>
            <option value="">{t("wholeTenant")}</option>
            {locations.map((location) => (
              <option key={location.value} value={location.value}>
                {location.label}
              </option>
            ))}
          </select>
          <Button type="submit" size="xs" disabled={Boolean(pending)}>
            {t("add")}
          </Button>
          <Button type="button" size="xs" variant="ghost" onClick={() => setAdding(false)}>
            {t("cancel")}
          </Button>
        </form>
      )}
      {error && <p className="text-metadata text-error">{error}</p>}
    </div>
  );
}
