import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ContractDetailView } from "@/components/contracts/ContractDetailView";
import { authApiGet } from "@/lib/admin-api";
import { getSession } from "@/lib/session";
import type { Contract } from "@/types/api";

async function getContract(id: string): Promise<Contract | null> {
  try {
    return await authApiGet<Contract>(`/contracts/${id}`);
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contractDetail");
  return { title: t("title") };
}

export default async function ContractPage(props: PageProps<"/contracts/[id]">) {
  const { id } = await props.params;
  const [session, contract] = await Promise.all([getSession(), getContract(id)]);
  if (!session || !contract) notFound();

  return <ContractDetailView initialContract={contract} currentUserId={session.userId} />;
}
