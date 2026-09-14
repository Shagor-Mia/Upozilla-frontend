"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { FormField } from "@/components/auth/FormField";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { usePublicSettings } from "@/components/settings/PublicSettingsProvider";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { notifyAuthChanged } from "@/lib/auth-events";
import { ClientApiError, clientApi } from "@/lib/client-api";
import type { OtpPurpose, OtpRequestResponse } from "@/types/api";

interface OtpFormProps {
  purpose: OtpPurpose;
  /** Where to go after the token pair lands in the cookies. Ignored when
   * `onSuccess` is provided. */
  next: string;
  submitLabel?: string;
  /** Used by the auth modal instead of a page navigation: closes the modal
   * and resumes whatever action triggered it, in place. */
  onSuccess?: () => void;
}

/**
 * Two-step phone OTP flow (Section 10): request a code, then verify it. The
 * verify step goes through `/api/auth/otp/verify` (not the generic proxy) so
 * the fresh JWT pair is written to the httpOnly cookies.
 */
export function OtpForm({ purpose, next, submitLabel, onSuccess }: OtpFormProps) {
  const t = useTranslations("otpForm");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileSiteKey = usePublicSettings().turnstile_site_key;

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await clientApi.post<OtpRequestResponse>("auth/otp/request", {
        phone,
        purpose,
        turnstile_token: turnstileToken,
      });
      setDevCode(result.dev_code);
      setExpiresIn(result.expires_in_seconds);
      setStep("code");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : t("sendError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        code: formData.get("code"),
        purpose,
        full_name: purpose === "register" ? fullName : undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: t("verifyError") }));
      setError(typeof body.detail === "string" ? body.detail : t("verifyError"));
      setSubmitting(false);
      return;
    }

    trackEvent({ event: "otp_verified", purpose });
    if (purpose === "register") trackEvent({ event: "signup", method: "otp" });
    notifyAuthChanged();
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(next);
      router.refresh();
    }
  }

  if (step === "phone") {
    return (
      <form key="phone-step" onSubmit={requestCode} className="space-y-4">
        {purpose === "register" && (
          <FormField
            label={t("fullNameLabel")}
            name="full_name"
            type="text"
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        )}
        <FormField
          label={t("mobileNumberLabel")}
          name="phone"
          type="tel"
          required
          autoFocus={purpose !== "register"}
          placeholder="01XXXXXXXXX"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="text-metadata text-on-surface-variant">{t("mobileNumberHelp")}</p>
        {turnstileSiteKey && <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} />}

        {error && <p className="text-body-md text-error">{error}</p>}

        <Button
          type="submit"
          disabled={submitting || (!!turnstileSiteKey && !turnstileToken)}
          className="w-full rounded-xl py-6"
        >
          {submitting ? t("sendingCode") : t("sendCode")}
        </Button>
      </form>
    );
  }

  return (
    // Distinct keys so React remounts the inputs between steps instead of
    // reusing the phone <input> DOM node for the code field.
    <form key="code-step" onSubmit={verifyCode} className="space-y-4">
      <p className="text-body-md text-on-surface-variant">
        {t("codeSentTo")} <span className="font-semibold text-on-surface">{phone}</span>{" "}
        {expiresIn ? t("validForMinutes", { minutes: Math.round(expiresIn / 60) }) : "."}
      </p>
      <FormField
        label={t("codeLabel")}
        name="code"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
        autoComplete="one-time-code"
      />
      {devCode && (
        <p
          data-testid="otp-dev-code"
          className="text-metadata rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-on-surface-variant"
        >
          {t("devModeNotice")} <span className="font-mono font-semibold text-on-surface">{devCode}</span>.
        </p>
      )}

      {error && <p className="text-body-md text-error">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full rounded-xl py-6">
        {submitting ? t("verifying") : (submitLabel ?? t("verify"))}
      </Button>
      <button
        type="button"
        onClick={() => {
          setStep("phone");
          setError(null);
        }}
        className="text-label-sm w-full text-primary hover:underline"
      >
        {t("useAnotherNumber")}
      </button>
    </form>
  );
}
