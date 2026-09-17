import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TrustGate } from "@/components/listings/TrustGate";
import { SchoolManageForm } from "@/components/schools/SchoolManageForm";
import { getLocationOptions } from "@/lib/locations";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellSchool");
  return { title: t("heading") };
}

export default async function SellSchoolPage() {
  const [t, session, locations] = await Promise.all([
    getTranslations("sellSchool"),
    getSession(),
    getLocationOptions(),
  ]);

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{t("description")}</p>

      {session && !session.canManageSchool ? (
        <div className="mt-6 max-w-2xl rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-6">
          <p className="text-body-md text-on-surface">{t("permissionNotice")}</p>
        </div>
      ) : (
        <TrustGate locked={!session} reason="signin" className="mt-6">
          <div className="max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
            <SchoolManageForm locations={locations} />
          </div>
        </TrustGate>
      )}
    </div>
  );
}
