"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { cn } from "@/lib/utils";

/** Phone-verification-gated features show a Locked icon over a desaturated
 * overlay instead of disappearing. Clicking it opens the sign-in/verify-phone
 * modal in place - on success the gate re-checks (via a route refresh)
 * instead of navigating the visitor away to a separate page. */
export function TrustGate({
  locked,
  reason,
  children,
  className,
}: {
  locked: boolean;
  reason: "signin" | "verify";
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const { promptSignIn, promptVerifyPhone } = useAuthModal();

  if (!locked) return <>{children}</>;

  const label = reason === "signin" ? "Sign in to continue" : "Verify your phone to continue";

  function handleClick() {
    const resume = () => router.refresh();
    if (reason === "signin") {
      promptSignIn(resume);
    } else {
      promptVerifyPhone(resume);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div aria-hidden="true" className="pointer-events-none opacity-40 grayscale select-none">
        {children}
      </div>
      <button
        type="button"
        onClick={handleClick}
        className="text-label-sm absolute inset-0 flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-outline-variant bg-surface/80 text-on-surface backdrop-blur-[2px] transition-colors hover:border-primary hover:text-primary"
      >
        <Lock size={20} />
        {label}
      </button>
    </div>
  );
}
