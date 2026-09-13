"use client";

import { Button } from "@/components/ui/button";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { Business } from "@/types/api";

/** Grants/revokes the verified badge (needs `business.verify`; the backend
 * re-checks and writes an audit entry). Mirrors UserStatusToggle. */
export function BusinessVerifyToggle({
  businessId,
  isVerified,
  disabled,
}: {
  businessId: string;
  isVerified: boolean;
  disabled?: boolean;
}) {
  const { run, pending, error } = useApiMutation("Failed");

  async function toggle() {
    if (isVerified && !window.confirm("Remove the verified badge from this business?")) return;
    await run(
      () => clientApi.patch<Business>(`admin/businesses/${businessId}/verification`, { is_verified: !isVerified }),
      { refresh: true }
    );
  }

  return (
    <div>
      <Button size="xs" variant={isVerified ? "outline" : "default"} disabled={Boolean(pending) || disabled} onClick={toggle}>
        {isVerified ? "Revoke" : "Verify"}
      </Button>
      {error && <p className="text-metadata mt-1 text-error">{error}</p>}
    </div>
  );
}
