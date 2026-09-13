import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MyListings } from "@/components/account/MyListings";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountListings");
  return { title: t("title") };
}

export default async function MyListingsPage(props: PageProps<"/account/listings">) {
  const searchParams = await props.searchParams;
  const justCreated = searchParams.created === "1";
  const t = await getTranslations("accountListings");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
          <p className="text-body-md mt-1 text-on-surface-variant">{t("description")}</p>
        </div>
        <Button render={<Link href="/sell" />} nativeButton={false}>
          {t("postListing")}
        </Button>
      </div>
      {justCreated && (
        <p className="text-body-md mt-4 rounded-xl border border-success/40 bg-success/5 px-4 py-3 text-on-surface">
          {t("justCreatedMessage")}
        </p>
      )}
      <div className="mt-6">
        <MyListings />
      </div>
    </div>
  );
}
