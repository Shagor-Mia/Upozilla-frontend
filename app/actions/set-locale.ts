"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, resolveLocale } from "@/lib/locale";

export async function setLocaleAction(locale: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, resolveLocale(locale), {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}
