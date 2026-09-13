export const SUPPORTED_LOCALES = ["bn", "en", "ar"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "bn";
export const LOCALE_COOKIE = "locale";

export function resolveLocale(raw: string | undefined): AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(raw ?? "") ? (raw as AppLocale) : DEFAULT_LOCALE;
}
