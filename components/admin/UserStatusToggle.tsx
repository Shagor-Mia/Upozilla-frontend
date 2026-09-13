"use client";

import { Button } from "@/components/ui/button";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";

export function UserStatusToggle({ userId, status, disabled }: { userId: string; status: string; disabled?: boolean }) {
  const { run, pending, error } = useApiMutation("Failed");
  const suspended = status !== "active";

  async function toggle() {
    if (!suspended && !window.confirm("Suspend this account? They will be signed out everywhere.")) return;
    await run(() => clientApi.patch(`admin/users/${userId}/status`, { status: suspended ? "active" : "suspended" }), {
      refresh: true,
    });
  }

  return (
    <div>
      <Button size="xs" variant={suspended ? "outline" : "destructive"} disabled={Boolean(pending) || disabled} onClick={toggle}>
        {suspended ? "Reactivate" : "Suspend"}
      </Button>
      {error && <p className="text-metadata mt-1 text-error">{error}</p>}
    </div>
  );
}
