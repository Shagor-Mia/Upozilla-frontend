import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminTable } from "@/components/admin/AdminTable";
import { BusinessVerifyToggle } from "@/components/admin/BusinessVerifyToggle";
import { StatusChip } from "@/components/listings/StatusChip";
import { VerifiedBadge } from "@/components/listings/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { authApiGet } from "@/lib/admin-api";
import { hasPermission } from "@/lib/roles";
import { getSession } from "@/lib/session";
import type { Business } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminBusinesses");
  return { title: t("businessVerification") };
}

/** Section 12 `business.verify` screen: every business regardless of status,
 * with a grant/revoke toggle for the verified badge. Editing the listing
 * itself lives in the generic CRUD view at /admin/business. */
export default async function AdminBusinessesPage() {
  const t = await getTranslations("adminBusinesses");
  const headings = [t("business"), t("contact"), t("status"), t("verification")];
  const session = await getSession();
  const canVerify = hasPermission(session?.roles ?? [], "business.verify");

  if (!canVerify) {
    return (
      <div>
        <h1 className="text-headline-lg text-on-surface">{t("businessVerification")}</h1>
        <p className="text-body-md mt-1 text-on-surface-variant">
          {t("noPermission")}
        </p>
      </div>
    );
  }

  const businesses = await authApiGet<Business[]>("/admin/businesses");
  // Unverified first so the review queue sits at the top; API order otherwise.
  const rows = [...businesses].sort((a, b) => Number(a.is_verified) - Number(b.is_verified));
  const pendingCount = businesses.filter((business) => !business.is_verified).length;
  const summary =
    pendingCount === 0
      ? t("allVerified")
      : t("pendingSummary", { pendingCount, total: businesses.length });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">{t("businessVerification")}</h1>
          <p className="text-body-md mt-1 text-on-surface-variant">
            {summary} {t("verificationNote")}
          </p>
        </div>
        <Button variant="outline" render={<Link href="/admin/business" />} nativeButton={false}>
          {t("editListings")}
        </Button>
      </div>

      <AdminTable headings={headings} isEmpty={rows.length === 0} emptyMessage={t("noBusinesses")}>
        {rows.map((business) => (
          <TableRow key={business.id}>
            <TableCell>
              <Link href={`/business/${business.slug}`} className="hover:text-primary hover:underline">
                {business.name}
              </Link>
              <div className="text-metadata capitalize text-on-surface-variant">{business.category}</div>
            </TableCell>
            <TableCell className="text-on-surface-variant">
              <div>{business.phone ?? "—"}</div>
              <div>{business.address ?? "—"}</div>
            </TableCell>
            <TableCell>
              <StatusChip status={business.status} />
            </TableCell>
            <TableCell>
              <div className="flex flex-col items-start gap-1">
                {business.is_verified ? (
                  <VerifiedBadge label={t("verified")} />
                ) : (
                  <span className="text-metadata text-on-surface-variant">{t("notVerified")}</span>
                )}
                <BusinessVerifyToggle businessId={business.id} isVerified={business.is_verified} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </AdminTable>
    </div>
  );
}
