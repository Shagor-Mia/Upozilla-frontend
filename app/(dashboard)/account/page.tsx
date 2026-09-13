import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LogoutAllButton } from "@/components/account/LogoutAllButton";
import { ProfileForm } from "@/components/account/ProfileForm";
import { Button } from "@/components/ui/button";
import { authApiGet } from "@/lib/admin-api";
import { ROLE_LABELS, normalizeRole } from "@/lib/roles";
import type { CurrentUser } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default async function AccountPage() {
  const user = await authApiGet<CurrentUser>("/auth/me");
  const t = await getTranslations("account");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
        <p className="text-body-md mt-1 text-on-surface-variant">{t("signedInAs", { name: user.full_name })}</p>
      </div>

      <section
        className={`rounded-xl border p-6 shadow-card ${
          user.phone_verified ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"
        }`}
      >
        <div className="flex items-start gap-3">
          {user.phone_verified ? (
            <ShieldCheck className="mt-0.5 shrink-0 text-success" size={24} />
          ) : (
            <ShieldAlert className="mt-0.5 shrink-0 text-warning" size={24} />
          )}
          <div className="flex-1">
            <h2 className="text-headline-md text-on-surface">
              {user.phone_verified ? t("phoneVerified") : t("phoneNotVerified")}
            </h2>
            <p className="text-body-md mt-1 text-on-surface-variant">
              {user.phone_verified
                ? t("phoneVerifiedBody", { phone: user.phone ?? "" })
                : t("phoneNotVerifiedBody")}
            </p>
            {!user.phone_verified && (
              <Button render={<Link href="/verify-phone?next=/account" />} nativeButton={false} className="mt-4">
                {t("verifyPhone")}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
        <h2 className="text-headline-md mb-4 text-on-surface">{t("profile")}</h2>
        <ProfileForm user={user} />
        <dl className="text-metadata mt-6 grid grid-cols-1 gap-2 border-t border-border-muted pt-4 text-on-surface-variant sm:grid-cols-2">
          <div>
            <dt className="font-semibold">{t("roles")}</dt>
            <dd>{user.roles.map((role) => ROLE_LABELS[normalizeRole(role) ?? "user"]).join(", ")}</dd>
          </div>
          <div>
            <dt className="font-semibold">{t("signInMethod")}</dt>
            <dd>
              {user.oauth_provider === "google"
                ? t("signInMethodGoogle")
                : user.oauth_provider === "facebook"
                  ? t("signInMethodFacebook")
                  : user.phone_verified
                    ? t("signInMethodPhoneOtp")
                    : t("signInMethodPassword")}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
        <h2 className="text-headline-md text-on-surface">{t("security")}</h2>
        <p className="text-body-md mt-1 mb-4 text-on-surface-variant">{t("securityBody")}</p>
        <LogoutAllButton />
      </section>
    </div>
  );
}
