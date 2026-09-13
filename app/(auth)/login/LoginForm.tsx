"use client";

import { LogIn } from "lucide-react";
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
import { notifyAuthChanged } from "@/lib/auth-events";

export function LoginForm({ next }: { next: string }) {
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
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: formData.get("identifier"),
        password: formData.get("password"),
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: t("loginFailed") }));
      setError(typeof body.detail === "string" ? body.detail : t("loginFailed"));
      setSubmitting(false);
      return;
    }

    notifyAuthChanged();
    router.push(next);
    router.refresh();
  }

  return (
    <AuthCard
      icon={LogIn}
      title={t("loginTitle")}
      description={t("loginDescription")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {t("registerLink")}
          </Link>
        </>
      }
    >
      <AuthMethodTabs value={method} onChange={setMethod} />

      {method === "otp" ? (
        <OtpForm purpose="login" next={next} submitLabel={t("signIn")} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label={t("emailOrPhoneLabel")} name="identifier" type="text" required autoFocus />
          <FormField label={t("passwordLabel")} name="password" type="password" required minLength={8} />

          {error && <p className="text-body-md text-error">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full rounded-xl py-6">
            {submitting ? t("signingIn") : t("signIn")}
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
