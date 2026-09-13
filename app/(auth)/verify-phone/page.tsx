import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AuthCard } from "@/components/auth/AuthCard";
import { OtpForm } from "@/components/auth/OtpForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("verifyPhoneTitle") };
}

/** Section 10 trust gate: selling, messaging and contact reveal all need a
 * verified phone. Route is protected by proxy.ts (sign-in required). */
export default async function VerifyPhonePage(props: PageProps<"/verify-phone">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "/account";
  const t = await getTranslations("auth");

  return (
    <AuthCard
      icon={ShieldCheck}
      title={t("verifyPhoneTitle")}
      description={t("verifyPhoneDescription")}
      footer={
        <Link href="/account" className="font-semibold text-primary hover:underline">
          {t("backToAccount")}
        </Link>
      }
    >
      <OtpForm purpose="verify_phone" next={next} submitLabel={t("verifyPhoneButton")} />
    </AuthCard>
  );
}
