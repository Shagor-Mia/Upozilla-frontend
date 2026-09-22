import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { StatusChip } from "@/components/listings/StatusChip";
import { Button } from "@/components/ui/button";
import { authApiGet } from "@/lib/admin-api";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import type { Contract, CurrentUser } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contracts");
  return { title: t("title") };
}

export default async function ContractsPage() {
  const t = await getTranslations("contracts");
  const [contracts, user] = await Promise.all([
    authApiGet<Contract[]>("/contracts/mine"),
    authApiGet<CurrentUser>("/auth/me"),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
          <p className="text-body-md mt-1 text-on-surface-variant">{t("subtitle")}</p>
        </div>
        <Button render={<Link href="/contracts/new" />} nativeButton={false}>
          {t("createNew")}
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
          <p className="text-body-md text-on-surface-variant">{t("emptyState")}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border-muted overflow-hidden rounded-xl border border-border-muted bg-surface-container-lowest shadow-card">
          {contracts.map((contract) => {
            const isEmployer = contract.employer_user_id === user.id;
            const otherName = (isEmployer ? contract.worker_name : contract.employer_name) ?? "-";
            return (
              <li key={contract.id}>
                <Link
                  href={`/contracts/${contract.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-container-low"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-body-md truncate font-semibold text-on-surface">{contract.title}</span>
                      <StatusChip status={contract.status} />
                    </div>
                    <p className="text-metadata mt-0.5 text-on-surface-variant">
                      {t("withPerson", { name: otherName })} · {isEmployer ? t("asEmployer") : t("asWorker")}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-body-md font-semibold text-on-surface">
                      {formatPrice(contract.payment_amount, contract.currency)}
                    </p>
                    <p className="text-metadata text-on-surface-variant">{formatRelativeTime(contract.created_at)}</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
