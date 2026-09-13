"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type AuthMethod = "password" | "otp";

export function AuthMethodTabs({
  value,
  onChange,
}: {
  value: AuthMethod;
  onChange: (method: AuthMethod) => void;
}) {
  const t = useTranslations("auth");
  const tabs: { key: AuthMethod; label: string }[] = [
    { key: "otp", label: t("otpTab") },
    { key: "password", label: t("passwordTab") },
  ];
  return (
    <div role="tablist" className="mb-6 grid grid-cols-2 rounded-xl bg-surface-container p-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          type="button"
          aria-selected={value === tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "text-label-sm rounded-lg px-3 py-2 transition-colors",
            value === tab.key
              ? "bg-surface-container-lowest text-primary shadow-card"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
