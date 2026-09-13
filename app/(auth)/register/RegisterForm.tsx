"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthMethodTabs, type AuthMethod } from "@/components/auth/AuthMethodTabs";
import { FacebookLoginButton } from "@/components/auth/FacebookLoginButton";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { FormField } from "@/components/auth/FormField";
import { OtpForm } from "@/components/auth/OtpForm";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { notifyAuthChanged } from "@/lib/auth-events";

export function RegisterForm({ next }: { next: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [method, setMethod] = useState<AuthMethod>("otp");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (!email && !phone) {
      setError(t("emailOrPhoneRequired"));
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: formData.get("full_name"),
        email: email || undefined,
        phone: phone || undefined,
        password: formData.get("password"),
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: t("registrationFailed") }));
      setError(typeof body.detail === "string" ? body.detail : t("registrationFailed"));
      setSubmitting(false);
      return;
    }

    trackEvent({ event: "signup", method: "password" });
    notifyAuthChanged();
    router.push(next);
    router.refresh();
  }

  return (
    <AuthCard
      icon={UserPlus}
      title={t("registerTitle")}
      description={t("registerDescription")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("signInLink")}
          </Link>
        </>
      }
    >
      <AuthMethodTabs value={method} onChange={setMethod} />

      {method === "otp" ? (
        <OtpForm purpose="register" next={next} submitLabel={t("createAccount")} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("fullNameLabel")} name="full_name" type="text" required autoFocus />
          <FormField label={t("emailLabel")} name="email" type="email" />
          <FormField label={t("phoneLabel")} name="phone" type="tel" placeholder={t("phonePlaceholder")} />
          <FormField label={t("passwordLabel")} name="password" type="password" required minLength={8} />
          <p className="text-metadata text-on-surface-variant">{t("phoneVerifyLaterNote")}</p>

          {error && <p className="text-body-md text-error">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full rounded-xl py-6">
            {submitting ? t("creatingAccount") : t("createAccount")}
          </Button>
        </form>
      )}

      <div className="mt-4 space-y-2">
        <GoogleLoginButton next={next} />
        <FacebookLoginButton next={next} />
      </div>
    </AuthCard>
  );
}
