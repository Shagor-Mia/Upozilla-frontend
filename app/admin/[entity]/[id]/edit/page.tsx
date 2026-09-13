import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { EntityForm } from "@/components/admin/EntityForm";
import { authApiGet } from "@/lib/admin-api";
import { ADMIN_ENTITIES, resolveEntityFields } from "@/lib/admin-entities";

export async function generateMetadata(
  props: PageProps<"/admin/[entity]/[id]/edit">
): Promise<Metadata> {
  const { entity } = await props.params;
  const entityConfig = ADMIN_ENTITIES[entity];
  if (!entityConfig) return { title: "Admin" };
  const t = await getTranslations("adminEntity");
  return { title: t("editLabel", { label: entityConfig.label }) };
}

export default async function AdminEntityEditPage(props: PageProps<"/admin/[entity]/[id]/edit">) {
  const { entity, id } = await props.params;
  const entityConfig = ADMIN_ENTITIES[entity];
  if (!entityConfig || !entityConfig.supportsEdit) notFound();
  const t = await getTranslations("adminEntity");

  const [fields, initialValues] = await Promise.all([
    resolveEntityFields(entityConfig.fields),
    authApiGet<Record<string, unknown>>(`${entityConfig.apiPath}/admin/${id}`),
  ]);

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("editLabel", { label: entityConfig.label })}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{entityConfig.description}</p>

      <div className="mt-6 max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
        <EntityForm
          entity={entity}
          apiPath={entityConfig.apiPath}
          label={entityConfig.label}
          fields={fields}
          recordId={id}
          initialValues={initialValues}
        />
      </div>
    </div>
  );
}
