import type { InputHTMLAttributes } from "react";

export function FormField({
  label,
  name,
  error,
  ...inputProps
}: {
  label: string;
  name: string;
  error?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-label-sm text-on-surface">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="text-body-md w-full rounded-xl border-2 border-border-muted bg-surface px-4 py-2.5 text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-0"
        {...inputProps}
      />
      {error && <p className="text-metadata text-error">{error}</p>}
    </div>
  );
}
