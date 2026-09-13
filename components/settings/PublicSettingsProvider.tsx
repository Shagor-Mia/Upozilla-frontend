"use client";

import { createContext, useContext } from "react";

import { ENV_PUBLIC_SETTINGS } from "@/lib/public-settings-defaults";
import type { PublicSettings } from "@/types/api";

const PublicSettingsContext = createContext<PublicSettings>(ENV_PUBLIC_SETTINGS);

/** Makes admin-editable integration keys (GTM, Mapbox, Facebook, Turnstile)
 * available to client components without each one fetching them. */
export function PublicSettingsProvider({ value, children }: { value: PublicSettings; children: React.ReactNode }) {
  return <PublicSettingsContext.Provider value={value}>{children}</PublicSettingsContext.Provider>;
}

export function usePublicSettings(): PublicSettings {
  return useContext(PublicSettingsContext);
}
