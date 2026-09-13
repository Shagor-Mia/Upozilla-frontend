import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MyShops } from "@/components/shops/MyShops";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountShops");
  return { title: t("title") };
}

export default async function MyShopsPage(props: PageProps<"/account/shops">) {
  const searchParams = await props.searchParams;
  const justCreated = searchParams.created === "1";
  const t = await getTranslations("accountShops");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
          <p className="text-body-md mt-1 text-on-surface-variant">{t("description")}</p>
        </div>
        <Button render={<Link href="/sell/shop" />} nativeButton={false}>
          {t("addNewShop")}
        </Button>
      </div>
      {justCreated && (
        <p className="text-body-md mt-4 rounded-xl border border-success/40 bg-success/5 px-4 py-3 text-on-surface">
          {t("justCreatedMessage")}
        </p>
      )}
      <div className="mt-6">
        <MyShops />
      </div>
    </div>
  );
}
