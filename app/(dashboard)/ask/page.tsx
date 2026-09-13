import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AskChat } from "@/components/ai/AskChat";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aiChat");
  return { title: t("title") };
}

export default function AskPage() {
  return <AskChat />;
}
