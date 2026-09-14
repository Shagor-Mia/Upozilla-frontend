"use client";

import { createContext, useCallback, useContext, useState } from "react";

import { AuthModal, type AuthModalStep } from "@/components/auth/AuthModal";
import { ClientApiError } from "@/lib/client-api";

type Resume = () => void;

interface AuthModalState {
  open: boolean;
  step: AuthModalStep;
  onSuccess?: Resume;
}

interface AuthModalContextValue {
  /** Opens the sign-in/register modal. `onSuccess` (if given) runs once the
   * user is authenticated, instead of any page navigation - use it to retry
   * whatever action needed auth. */
  promptSignIn: (onSuccess?: Resume) => void;
  /** Opens the phone-verification step directly (the user is already signed
   * in, just not phone-verified yet). */
  promptVerifyPhone: (onSuccess?: Resume) => void;
  /**
   * Drop-in replacement for the old "catch a 401/403 and redirect" pattern:
   * pass the error from a failed API call plus a `retry` that repeats the
   * exact same call. Returns true if it opened a modal (caller should treat
   * the error as handled), false otherwise.
   */
  handleAuthError: (error: unknown, retry?: Resume) => boolean;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

const INITIAL_STATE: AuthModalState = { open: false, step: "signin" };

/**
 * Mounted once at the app root (see app/layout.tsx), same pattern as
 * PublicSettingsProvider. Lets any client component "pop up" a login/verify
 * prompt in place - instead of `router.push('/login?next=...')` - and resume
 * the action that needed auth once the user is signed in, without losing
 * whatever the user was doing on the page underneath.
 */
export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthModalState>(INITIAL_STATE);

  const promptSignIn = useCallback((onSuccess?: Resume) => {
    setState({ open: true, step: "signin", onSuccess });
  }, []);

  const promptVerifyPhone = useCallback((onSuccess?: Resume) => {
    setState({ open: true, step: "verify-phone", onSuccess });
  }, []);

  const closeAuthModal = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const handleAuthError = useCallback(
    (error: unknown, retry?: Resume) => {
      if (error instanceof ClientApiError) {
        if (error.isUnauthenticated) {
          promptSignIn(retry);
          return true;
        }
        if (error.isPhoneVerificationRequired) {
          promptVerifyPhone(retry);
          return true;
        }
      }
      return false;
    },
    [promptSignIn, promptVerifyPhone]
  );

  function handleSuccess() {
    const resume = state.onSuccess;
    closeAuthModal();
    resume?.();
  }

  return (
    <AuthModalContext.Provider value={{ promptSignIn, promptVerifyPhone, handleAuthError, closeAuthModal }}>
      {children}
      <AuthModal
        open={state.open}
        step={state.step}
        onStepChange={(step) => setState((current) => ({ ...current, step }))}
        onClose={closeAuthModal}
        onSuccess={handleSuccess}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within an AuthModalProvider");
  return ctx;
}
