import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminTable } from "@/components/admin/AdminTable";
import { TableCell, TableRow } from "@/components/ui/table";
import { authApiGet } from "@/lib/admin-api";
import { formatRelativeTime } from "@/lib/format";
import type { AuditLogEntry } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminAudit");
  return { title: t("auditLog") };
}

export default async function AuditLogPage() {
  const t = await getTranslations("adminAudit");
  const entries = await authApiGet<AuditLogEntry[]>("/admin/audit-logs");
  const headings = [t("when"), t("actor"), t("action"), t("entity"), t("details")];

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("auditLog")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">
        {t("description")}
      </p>

      <AdminTable headings={headings} isEmpty={entries.length === 0} emptyMessage={t("noActions")}>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-metadata whitespace-nowrap text-on-surface-variant">
              {formatRelativeTime(entry.created_at)}
            </TableCell>
            <TableCell>{entry.actor_name}</TableCell>
            <TableCell className="font-mono">{entry.action}</TableCell>
            <TableCell className="text-metadata text-on-surface-variant">
              {entry.entity_type}
              {entry.entity_id && <div className="font-mono">{entry.entity_id.slice(0, 8)}…</div>}
            </TableCell>
            <TableCell className="text-metadata font-mono text-on-surface-variant">
              {Object.keys(entry.meta).length ? JSON.stringify(entry.meta) : "—"}
            </TableCell>
          </TableRow>
        ))}
      </AdminTable>
    </div>
  );
}
