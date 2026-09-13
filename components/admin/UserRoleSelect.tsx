"use client";

import { selectClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/roles";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { Role } from "@/types/api";

export function UserRoleSelect({ userId, role, disabled }: { userId: string; role: Role; disabled?: boolean }) {
  const { run, pending, error } = useApiMutation("Failed");

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    await run(() => clientApi.patch(`admin/users/${userId}/role`, { role: event.target.value }), { refresh: true });
  }

  return (
    <div>
      <select
        defaultValue={role}
        disabled={Boolean(pending) || disabled}
        onChange={handleChange}
        aria-label="Primary role"
        className={`${selectClass} w-auto px-2 py-1`}
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {error && <p className="text-metadata mt-1 text-error">{error}</p>}
    </div>
  );
}
