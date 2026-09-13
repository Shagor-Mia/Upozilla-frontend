import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-4 py-24 text-center md:px-12">
      <h1 className="text-headline-lg text-on-surface">{t("notFoundTitle")}</h1>
      <p className="text-body-md text-on-surface-variant">{t("notFoundBody")}</p>
      <Button render={<Link href="/" />} nativeButton={false} className="rounded-xl">
        {t("backHome")}
      </Button>
    </div>
  );
}
