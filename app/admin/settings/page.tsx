import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AiSettingsPanel } from "@/components/admin/settings/AiSettingsPanel";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { authApiGet } from "@/lib/admin-api";
import type { AdminSettingItem, AiSettings } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminSettings");
  return { title: t("title") };
}

export default async function AdminSettingsPage() {
  const t = await getTranslations("adminSettings");
  const [items, aiSettings] = await Promise.all([
    authApiGet<AdminSettingItem[]>("/admin/settings"),
    authApiGet<AiSettings>("/admin/settings/ai"),
  ]);

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
      <p className="text-body-md mt-1 mb-6 text-on-surface-variant">{t("description")}</p>
      <div className="space-y-6">
        <AiSettingsPanel data={aiSettings} />
        <SettingsForm items={items.filter((item) => item.group !== "ai")} />
      </div>
    </div>
  );
}
