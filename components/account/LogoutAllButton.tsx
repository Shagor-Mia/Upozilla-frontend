"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { notifyAuthChanged } from "@/lib/auth-events";
import { clientApi } from "@/lib/client-api";

/** Section 14.2: "log out all devices" revokes the whole refresh-token family. */
export function LogoutAllButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    await clientApi.post("auth/logout-all").catch(() => undefined);
    await fetch("/api/auth/logout", { method: "POST" });
    notifyAuthChanged();
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={busy}>
      {busy ? "Signing out…" : "Sign out of all devices"}
    </Button>
  );
}
