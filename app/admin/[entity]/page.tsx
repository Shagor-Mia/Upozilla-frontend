import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { AdminTable } from "@/components/admin/AdminTable";
import { StatusChip } from "@/components/listings/StatusChip";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { authApiGet } from "@/lib/admin-api";
import { ADMIN_ENTITIES } from "@/lib/admin-entities";
import { apiGet } from "@/lib/api-client";
import type { Paginated } from "@/types/api";

export async function generateMetadata(
  props: PageProps<"/admin/[entity]">
): Promise<Metadata> {
  const { entity } = await props.params;
  const entityConfig = ADMIN_ENTITIES[entity];
  return { title: entityConfig ? entityConfig.label : "Admin" };
}

type Row = Record<string, unknown>;

function readPath(row: Row, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object") return (value as Row)[key];
    return undefined;
  }, row);
}

const STATUS_COLUMNS = new Set(["status", "moderation_status"]);

function renderCell(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (STATUS_COLUMNS.has(key) && typeof value === "string") return <StatusChip status={value} />;
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default async function AdminEntityListPage(props: PageProps<"/admin/[entity]">) {
  const { entity } = await props.params;
  const entityConfig = ADMIN_ENTITIES[entity];
  if (!entityConfig) notFound();
  const t = await getTranslations("adminEntity");

  const listPath = entityConfig.listPath ?? entityConfig.apiPath;
  const rows = entityConfig.paginated
    ? (
        await apiGet<Paginated<Row>>(listPath, { revalidateSeconds: 0, searchParams: { page_size: "60" } })
      ).items
    : entityConfig.requiresAuth
      ? await authApiGet<Row[]>(listPath)
      : await apiGet<Row[]>(listPath, { revalidateSeconds: 0 });

  const headings = [...entityConfig.columns.map((column) => column.label), ...(entityConfig.supportsEdit ? [""] : [])];

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface">{entityConfig.label}</h1>
          <p className="text-body-md mt-1 text-on-surface-variant">{entityConfig.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {entityConfig.related && (
            <Button variant="outline" render={<Link href={entityConfig.related.href} />} nativeButton={false}>
              {entityConfig.related.label}
            </Button>
          )}
          <Button render={<Link href={`/admin/${entity}/new`} />} nativeButton={false}>
            {t("addNew")}
          </Button>
        </div>
      </div>

      <AdminTable
        headings={headings}
        isEmpty={rows.length === 0}
        emptyMessage={t("noItemsYet", { label: entityConfig.label.toLowerCase() })}
      >
        {rows.map((row) => (
          <TableRow key={String(row.id)}>
            {entityConfig.columns.map((column) => (
              <TableCell key={column.key}>{renderCell(column.key, readPath(row, column.key))}</TableCell>
            ))}
            {entityConfig.supportsEdit && (
              <TableCell className="text-right">
                <Link href={`/admin/${entity}/${row.id}/edit`} className="text-label-sm text-primary hover:underline">
                  {t("editLink")}
                </Link>
              </TableCell>
            )}
          </TableRow>
        ))}
      </AdminTable>
    </div>
  );
}
