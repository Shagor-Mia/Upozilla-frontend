"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { inputClass, labelClass, selectClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { AdminSettingItem } from "@/types/api";

const GROUP_LABEL_KEYS: Record<string, { titleKey: string; descriptionKey: string }> = {
  general: { titleKey: "generalTitle", descriptionKey: "generalDescription" },
  sms: { titleKey: "smsTitle", descriptionKey: "smsDescription" },
  captcha: { titleKey: "captchaTitle", descriptionKey: "captchaDescription" },
  facebook: { titleKey: "facebookTitle", descriptionKey: "facebookDescription" },
  google: { titleKey: "googleTitle", descriptionKey: "googleDescription" },
  analytics: { titleKey: "analyticsTitle", descriptionKey: "analyticsDescription" },
  maps: { titleKey: "mapsTitle", descriptionKey: "mapsDescription" },
  marketplace: { titleKey: "marketplaceTitle", descriptionKey: "marketplaceDescription" },
};

/** Admin-editable integration settings. Secrets are write-only: the form only
 * shows whether one is configured, never the stored value. */
export function SettingsForm({ items }: { items: AdminSettingItem[] }) {
  const t = useTranslations("settingsForm");
  const SOURCE_LABEL: Record<AdminSettingItem["source"], string> = {
    database: t("sourceDatabase"),
    environment: t("sourceEnvironment"),
    none: t("sourceNone"),
  };
  const [values, setValues] = useState<Record<string, string>>({});
  const [clears, setClears] = useState<Set<string>>(new Set());
  const { run, pending: saving, error } = useApiMutation(t("couldNotSave"));
  const [saved, setSaved] = useState(false);

  const groups = Array.from(new Set(items.map((item) => item.group)));

  function setValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setClears((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  function toggleClear(key: string) {
    setClears((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setValues((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const payload: Record<string, string | null> = { ...values };
    clears.forEach((key) => {
      payload[key] = null;
    });
    if (Object.keys(payload).length === 0) return;

    await run(() => clientApi.put("admin/settings", { values: payload }), {
      refresh: true,
      onSuccess: () => {
        setValues({});
        setClears(new Set());
        setSaved(true);
      },
    });
  }

  const dirty = Object.keys(values).length > 0 || clears.size > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {groups.map((group) => (
        <section
          key={group}
          className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card"
        >
          <h2 className="text-headline-md text-on-surface">
            {GROUP_LABEL_KEYS[group] ? t(GROUP_LABEL_KEYS[group].titleKey) : group}
          </h2>
          {GROUP_LABEL_KEYS[group] && (
            <p className="text-body-md mt-1 mb-4 text-on-surface-variant">{t(GROUP_LABEL_KEYS[group].descriptionKey)}</p>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items
              .filter((item) => item.group === group)
              .map((item) => {
                const pendingClear = clears.has(item.key);
                const current = values[item.key];
                return (
                  <div key={item.key} className="space-y-1.5">
                    <label htmlFor={item.key} className={labelClass}>
                      {item.label}
                      {item.is_public && (
                        <span className="text-metadata ms-2 rounded-full bg-surface-container px-2 py-0.5 text-on-surface-variant">
                          {t("public")}
                        </span>
                      )}
                    </label>
                    {item.kind === "select" ? (
                      <select
                        id={item.key}
                        value={current ?? item.value ?? ""}
                        onChange={(e) => setValue(item.key, e.target.value)}
                        className={selectClass}
                      >
                        {item.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={item.key}
                        type={item.is_secret ? "password" : item.kind === "int" ? "number" : "text"}
                        autoComplete="off"
                        value={current ?? (item.is_secret ? "" : (item.value ?? ""))}
                        placeholder={item.is_secret && item.is_configured ? t("secretConfiguredPlaceholder") : undefined}
                        disabled={pendingClear}
                        onChange={(e) => setValue(item.key, e.target.value)}
                        className={inputClass}
                      />
                    )}
                    <p className="text-metadata flex flex-wrap items-center gap-2 text-on-surface-variant">
                      <span>{item.help}</span>
                      <span className={item.is_configured ? "text-success" : "text-warning"}>
                        {SOURCE_LABEL[item.source]}
                      </span>
                      {item.source === "database" && (
                        <button type="button" onClick={() => toggleClear(item.key)} className="text-admin-blue hover:underline">
                          {pendingClear ? t("keepValue") : t("clear")}
                        </button>
                      )}
                    </p>
                  </div>
                );
              })}
          </div>
        </section>
      ))}

      {error && <p className="text-body-md text-error">{error}</p>}
      {saved && <p className="text-body-md text-success">{t("savedMessage")}</p>}

      <Button type="submit" disabled={Boolean(saving) || !dirty}>
        {saving ? t("saving") : t("saveSettings")}
      </Button>
    </form>
  );
}
