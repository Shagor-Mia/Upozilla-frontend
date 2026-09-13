"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { CurrentUser } from "@/types/api";

export function ProfileForm({ user }: { user: CurrentUser }) {
  const t = useTranslations("profileForm");
  const { run, pending: submitting, error } = useApiMutation(t("saveError"));
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    await run(
      () =>
        clientApi.patch("users/me", {
          full_name: String(formData.get("full_name") ?? "").trim(),
          email: email || null,
        }),
      { refresh: true, onSuccess: () => setSaved(true) }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label={t("fullName")} name="full_name" type="text" required defaultValue={user.full_name} />
      <FormField label={t("email")} name="email" type="email" defaultValue={user.email ?? ""} />
      {error && <p className="text-body-md text-error">{error}</p>}
      {saved && <p className="text-body-md text-success">{t("profileSaved")}</p>}
      <Button type="submit" disabled={Boolean(submitting)}>
        {submitting ? t("saving") : t("saveChanges")}
      </Button>
    </form>
  );
}
