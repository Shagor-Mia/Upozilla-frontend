"use client";

import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { inputClass, labelClass, selectClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import { cn } from "@/lib/utils";
import type { AiSettings, AiTier, TestConnectionResult } from "@/types/api";

const TIERS: { value: AiTier; nameKey: string; descriptionKey: string }[] = [
  { value: "economy", nameKey: "tierEconomy", descriptionKey: "tierEconomyDescription" },
  { value: "standard", nameKey: "tierStandard", descriptionKey: "tierStandardDescription" },
  { value: "premium", nameKey: "tierPremium", descriptionKey: "tierPremiumDescription" },
];

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

/** Section 23 follow-up: one dedicated panel for the chatbot/translation/news
 * enrichment's shared API key - tiers, encrypted-at-rest masked key, Test
 * Connection, Disconnect. Modeled on a reference screenshot the project
 * owner shared, adapted to this codebase's own conventions (SettingsForm.tsx's
 * password-field/help-text style, clientApi for authenticated writes). */
export function AiSettingsPanel({ data }: { data: AiSettings }) {
  const t = useTranslations("aiSettings");

  const [tier, setTier] = useState<AiTier>(data.tier);
  const [translationMode, setTranslationMode] = useState(data.translation_mode);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [saved, setSaved] = useState(false);
  const { run, pending, error } = useApiMutation(t("couldNotSave"));
  const testing = pending === "test";
  const saving = pending === "save";
  const disconnecting = pending === "disconnect";

  async function handleTest() {
    setTestResult(null);
    await run(
      () => clientApi.post<TestConnectionResult>("admin/settings/ai/test-connection", { api_key: apiKey.trim() || undefined }),
      { key: "test", fallbackError: t("couldNotTest"), onSuccess: setTestResult }
    );
  }

  async function handleSave() {
    setSaved(false);
    setTestResult(null);
    await run(
      async () => {
        const values: Record<string, string> = { ai_tier: tier, translation_mode: translationMode };
        if (apiKey.trim()) values.openai_api_key = apiKey.trim();
        await clientApi.put("admin/settings", { values });
        if (apiKey.trim()) await clientApi.post("admin/settings/ai/test-connection", {});
      },
      {
        key: "save",
        refresh: true,
        onSuccess: () => {
          setApiKey("");
          setSaved(true);
        },
      }
    );
  }

  async function handleDisconnect() {
    if (!window.confirm(t("disconnectConfirm"))) return;
    await run(() => clientApi.post("admin/settings/ai/disconnect"), {
      key: "disconnect",
      refresh: true,
      fallbackError: t("couldNotDisconnect"),
    });
  }

  return (
    <section className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="text-primary" size={22} />
        <h2 className="text-headline-md text-on-surface">{t("title")}</h2>
      </div>
      <p className="text-body-md mb-6 text-on-surface-variant">{t("description")}</p>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TIERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTier(option.value)}
            className={cn(
              "rounded-xl border-2 p-4 text-start transition-colors",
              tier === option.value ? "border-primary bg-primary/5" : "border-border-muted hover:border-outline-variant"
            )}
          >
            <p className="text-body-md font-semibold text-on-surface">{t(option.nameKey)}</p>
            <p className="text-metadata mt-0.5 text-on-surface-variant">{t(option.descriptionKey)}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 space-y-1.5">
        <label className={labelClass}>{t("translationMode")}</label>
        <select
          value={translationMode}
          onChange={(e) => setTranslationMode(e.target.value as AiSettings["translation_mode"])}
          className={selectClass}
        >
          <option value="manual">{t("translationManual")}</option>
          <option value="automatic">{t("translationAutomatic")}</option>
        </select>
      </div>

      <div className="mb-4 rounded-xl border border-border-muted p-4">
        <p className="text-body-md font-semibold text-on-surface">{t("apiKey")}</p>
        <p className="text-metadata mt-1 text-on-surface-variant">{t("apiKeyHelp")}</p>

        {data.is_configured ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-metadata text-on-surface-variant">{t("apiKey")}</p>
              <p className="text-body-md font-mono text-on-surface">{data.masked_key}</p>
            </div>
            <div>
              <p className="text-metadata text-on-surface-variant">{t("lastVerified")}</p>
              <p className="text-body-md text-on-surface">
                {data.last_verified_at ? formatTimestamp(data.last_verified_at) : t("neverVerified")}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-body-md mt-3 text-warning">{t("notConfigured")}</p>
        )}

        <div className="mt-4 space-y-1.5">
          <label htmlFor="ai_api_key" className={labelClass}>
            {t("apiKeyInputLabel")}
          </label>
          <div className="relative">
            <input
              id="ai_api_key"
              type={showKey ? "text" : "password"}
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={cn(inputClass, "pe-10")}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute inset-y-0 end-0 flex items-center px-3 text-on-surface-variant"
              aria-label={showKey ? "Hide" : "Show"}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {testResult && (
          <p className={cn("text-body-md mt-3", testResult.valid ? "text-success" : "text-error")}>
            {testResult.message}
          </p>
        )}
      </div>

      {error && <p className="text-body-md mb-3 text-error">{error}</p>}
      {saved && <p className="text-body-md mb-3 text-success">{t("savedMessage")}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? t("testing") : t("testConnection")}
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? t("saving") : t("updateSettings")}
        </Button>
        {data.is_configured && (
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {t("disconnect")}
          </Button>
        )}
      </div>
    </section>
  );
}
