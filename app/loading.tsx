import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");

  return (
    <div className="mx-auto flex max-w-[1280px] items-center justify-center px-4 py-24 md:px-12">
      <div className="flex items-center gap-3 text-body-md text-on-surface-variant">
        <span className="size-5 shrink-0 animate-spin rounded-full border-2 border-border-muted border-t-primary" />
        {t("loading")}
      </div>
    </div>
  );
}
