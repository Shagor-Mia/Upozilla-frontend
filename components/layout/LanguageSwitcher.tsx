"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition, type ChangeEvent } from "react";

import { setLocaleAction } from "@/app/actions/set-locale";

// Names are shown in their own script, not translated, so a viewer can
// always find their language regardless of the site's current locale.
const OPTIONS = [
  { value: "bn", label: "বাংলা" },
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={pending}
      aria-label="Language"
      className="text-label-sm min-h-10 rounded-lg border-2 border-border-muted bg-surface px-2 py-1.5 text-on-surface transition-colors focus:border-primary focus:outline-none disabled:opacity-60"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
