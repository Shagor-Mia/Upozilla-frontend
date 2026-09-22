import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { CreateContractForm } from "@/components/contracts/CreateContractForm";
import { TrustGate } from "@/components/listings/TrustGate";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contractForm");
  return { title: t("title") };
}

export default async function NewContractPage(props: PageProps<"/contracts/new">) {
  const searchParams = await props.searchParams;
  const t = await getTranslations("contractForm");
  const session = await getSession();
  const gateReason = session && !session.phoneVerified ? "verify" : null;

  const workerId = typeof searchParams.workerId === "string" ? searchParams.workerId : undefined;
  const workerName = typeof searchParams.workerName === "string" ? searchParams.workerName : undefined;

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{t("subtitle")}</p>
      <TrustGate locked={gateReason !== null} reason={gateReason ?? "signin"} className="mt-6">
        <div className="max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
          <CreateContractForm defaultWorkerId={workerId} defaultWorkerName={workerName} />
        </div>
      </TrustGate>
    </div>
  );
}
