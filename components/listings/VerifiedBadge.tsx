import { cn } from "@/lib/utils";

/** DESIGN.md: trust badges are a dedicated filled checkmark in a pill - visually
 * distinct from Lucide UI icons so they can't be mistaken for an action. */
export function VerifiedBadge({ label = "Verified seller", className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "text-metadata inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-semibold text-primary",
        className
      )}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
        <path d="M10 1.5l2.2 1.6 2.7-.3 1 2.5 2.4 1.3-.5 2.7 1.4 2.3-1.9 2-.1 2.7-2.6.7-1.5 2.3-2.6-.9-2.5.9-1.5-2.3-2.6-.7-.1-2.7L1.9 11l1.4-2.3-.5-2.7L5.2 4.7l1-2.5 2.7.3L10 1.5zm-1.1 11.2l4.8-4.8-1.2-1.2-3.6 3.6-1.6-1.6-1.2 1.2 2.8 2.8z" />
      </svg>
      {label}
    </span>
  );
}
