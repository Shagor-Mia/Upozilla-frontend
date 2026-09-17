"use client";

import { Button } from "@/components/ui/button";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";

export function HospitalPermissionToggle({
  userId,
  granted,
  disabled,
}: {
  userId: string;
  granted: boolean;
  disabled?: boolean;
}) {
  const { run, pending, error } = useApiMutation("Failed");

  async function toggle() {
    await run(() => clientApi.patch(`admin/users/${userId}/hospital-permission`, { granted: !granted }), {
      refresh: true,
    });
  }

  return (
    <div>
      <Button size="xs" variant={granted ? "destructive" : "outline"} disabled={Boolean(pending) || disabled} onClick={toggle}>
        {granted ? "Revoke" : "Grant"}
      </Button>
      {error && <p className="text-metadata mt-1 text-error">{error}</p>}
    </div>
  );
}
