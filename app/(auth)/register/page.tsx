import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { RegisterForm } from "./RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("registerTitle") };
}

export default async function RegisterPage(props: PageProps<"/register">) {
  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "/";

  return <RegisterForm next={next} />;
}
