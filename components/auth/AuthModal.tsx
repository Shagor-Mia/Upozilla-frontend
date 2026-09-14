"use client";

import { ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { LoginForm } from "@/app/(auth)/login/LoginForm";
import { RegisterForm } from "@/app/(auth)/register/RegisterForm";
import { OtpForm } from "@/components/auth/OtpForm";

export type AuthModalStep = "signin" | "register" | "verify-phone";

/**
 * The popup itself: sign-in / register / verify-phone, mounted once at the
 * root by AuthModalProvider. Never navigates - success always closes the
 * modal and resumes whatever action opened it, in place.
 */
export function AuthModal({
  open,
  step,
  onStepChange,
  onClose,
  onSuccess,
}: {
  open: boolean;
  step: AuthModalStep;
  onStepChange: (step: AuthModalStep) => void;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={step === "verify-phone" ? t("verifyPhoneTitle") : t("loginTitle")}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border-muted bg-surface-container-lowest p-8 shadow-card outline-none"
      >
        {/* size-11 (44px): was a 32px p-1.5 button - under the touch-target
            guideline on a new component the mobile-responsiveness audit
            never covered (it didn't exist yet at audit time). */}
        <button
          type="button"
          onClick={onClose}
          aria-label={tCommon("close")}
          className="absolute end-3 top-3 flex size-11 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
        >
          <X size={20} />
        </button>

        {step === "signin" && (
          <LoginForm
            next="/"
            variant="modal"
            onSuccess={onSuccess}
            onSwitchToRegister={() => onStepChange("register")}
          />
        )}

        {step === "register" && (
          <RegisterForm
            next="/"
            variant="modal"
            onSuccess={onSuccess}
            onSwitchToLogin={() => onStepChange("signin")}
          />
        )}

        {step === "verify-phone" && (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container">
                <ShieldCheck className="text-on-primary-container" size={28} />
              </div>
              <h1 className="text-headline-lg text-on-surface">{t("verifyPhoneTitle")}</h1>
              <p className="text-body-md mt-2 max-w-[280px] text-on-surface-variant">{t("verifyPhoneDescription")}</p>
            </div>
            <div className="mt-8">
              <OtpForm purpose="verify_phone" next="/" submitLabel={t("verifyPhoneButton")} onSuccess={onSuccess} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
