import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "@/lib/locale";

// No `[locale]` URL routing (Section: Bangla-default localization) - the
// locale is a per-viewer cookie, not part of the URL. Defaults to Bangla
// regardless of the browser's Accept-Language.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
