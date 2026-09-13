import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "error" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-success/15 text-on-success-container",
  warning: "bg-warning/15 text-on-warning-container",
  error: "bg-error-container text-on-error-container",
  neutral: "bg-surface-container text-on-surface-variant",
};

const STATUS_TONE: Record<string, Tone> = {
  active: "success",
  approved: "success",
  pending: "warning",
  rejected: "error",
  reported: "error",
  sold: "neutral",
  expired: "neutral",
  hidden: "neutral",
  removed: "neutral",
  suspended: "error",
  open: "warning",
  upheld: "error",
  dismissed: "neutral",
};

/** DESIGN.md status chips: colour is always paired with the text label
 * (Accessibility), Green = approved, Amber = pending, Red = rejected. */
export function StatusChip({ status, label, className }: { status: string; label?: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "neutral";
  return (
    <span
      className={cn(
        "text-metadata inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold capitalize",
        TONE_CLASS[tone],
        className
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
