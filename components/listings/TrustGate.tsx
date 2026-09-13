import { Lock } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** DESIGN.md "Trust Gates": phone-verification-gated features show a Locked
 * icon over a desaturated overlay instead of disappearing. */
export function TrustGate({
  locked,
  reason,
  next,
  children,
  className,
}: {
  locked: boolean;
  reason: "signin" | "verify";
  next: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!locked) return <>{children}</>;

  const href =
    reason === "signin"
      ? `/login?next=${encodeURIComponent(next)}`
      : `/verify-phone?next=${encodeURIComponent(next)}`;
  const label = reason === "signin" ? "Sign in to continue" : "Verify your phone to continue";

  return (
    <div className={cn("relative", className)}>
      <div aria-hidden="true" className="pointer-events-none opacity-40 grayscale select-none">
        {children}
      </div>
      <Link
        href={href}
        className="text-label-sm absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-outline-variant bg-surface/80 text-on-surface backdrop-blur-[2px] transition-colors hover:border-primary hover:text-primary"
      >
        <Lock size={20} />
        {label}
      </Link>
    </div>
  );
}
