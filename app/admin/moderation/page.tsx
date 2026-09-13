import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ModerationQueue } from "@/components/admin/ModerationQueue";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminModeration");
  return { title: t("moderationQueue") };
}

export default async function ModerationPage() {
  const t = await getTranslations("adminModeration");
  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("moderationQueue")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">
        {t("description")}
      </p>
      <div className="mt-6">
        <ModerationQueue />
      </div>
    </div>
  );
}
