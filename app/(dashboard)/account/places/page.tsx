import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MyPlaces } from "@/components/account/MyPlaces";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("myPlaces");
  return { title: t("heading") };
}

export default async function MyPlacesPage(props: PageProps<"/account/places">) {
  const searchParams = await props.searchParams;
  const justSubmitted = searchParams.submitted === "1";
  const t = await getTranslations("myPlaces");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
        <Button render={<Link href="/sell/place" />} nativeButton={false}>
          {t("addFirst")}
        </Button>
      </div>
      {justSubmitted && (
        <p className="text-body-md mt-4 rounded-xl border border-success/40 bg-success/5 px-4 py-3 text-on-surface">
          {t("moderationPending")}
        </p>
      )}
      <div className="mt-6">
        <MyPlaces />
      </div>
    </div>
  );
}
