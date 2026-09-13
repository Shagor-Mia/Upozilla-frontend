"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { inputClass, selectClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { EntityField } from "@/lib/admin-entities";

const LOCALES: { suffix: "bn" | "en" | "ar"; label: string }[] = [
  { suffix: "bn", label: "বাংলা" },
  { suffix: "en", label: "English" },
  { suffix: "ar", label: "العربية" },
];

function coerceValue(field: EntityField, raw: FormDataEntryValue | null): unknown {
  if (field.type === "checkbox") return raw === "on";
  if (raw === null || raw === "") return field.type === "select" ? undefined : null;

  const value = String(raw);
  if (field.isCommaList) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (field.type === "number") return Number(value);
  if (field.type === "datetime-local") return new Date(value).toISOString();
  return value;
}

/** Renders an initial field value (from an admin-raw record, Section 22.2) as
 * the string an `<input>`/`<textarea>` `defaultValue` expects. */
function defaultTextValue(field: EntityField, value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (field.isCommaList && Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function EntityForm({
  entity,
  apiPath,
  label,
  fields,
  recordId,
  initialValues,
}: {
  entity: string;
  /** Backend create/edit path, e.g. `/marketplace/products` (`EntityConfig.apiPath`). */
  apiPath: string;
  label: string;
  fields: EntityField[];
  /** When set, the form edits this record (PATCH) instead of creating one (POST). */
  recordId?: string;
  /** Raw admin values to pre-fill, e.g. from `GET {apiPath}/admin/{id}`. */
  initialValues?: Record<string, unknown>;
}) {
  const t = useTranslations("adminEntity");
  const router = useRouter();
  const { run, pending: submitting, error } = useApiMutation(t("saveFailed", { label }));
  const isEdit = Boolean(recordId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.localized) {
        for (const { suffix } of LOCALES) {
          payload[`${field.name}_${suffix}`] = coerceValue(field, formData.get(`${field.name}_${suffix}`));
        }
        continue;
      }
      payload[field.name] = coerceValue(field, formData.get(field.name));
    }

    await run(() => (isEdit ? clientApi.patch(`${apiPath}/${recordId}`, payload) : clientApi.post(apiPath, payload)), {
      onSuccess: () => {
        router.push(`/admin/${entity}`);
        router.refresh();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) =>
        field.localized ? (
          <div key={field.name} className="space-y-1.5">
            <label className="text-label-sm text-on-surface">
              {field.label}
              {field.required && <span className="text-error"> *</span>}
            </label>
            <div className="space-y-2">
              {LOCALES.map(({ suffix, label }) => {
                const value = defaultTextValue(field, initialValues?.[`${field.name}_${suffix}`]);
                return (
                  <div key={suffix} className="flex items-start gap-2">
                    <span className="text-metadata w-16 shrink-0 pt-2.5 text-on-surface-variant">{label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        id={`${field.name}_${suffix}`}
                        name={`${field.name}_${suffix}`}
                        required={suffix === "bn" && field.required}
                        rows={3}
                        defaultValue={value}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        id={`${field.name}_${suffix}`}
                        name={`${field.name}_${suffix}`}
                        type="text"
                        required={suffix === "bn" && field.required}
                        defaultValue={value}
                        className={inputClass}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {field.help && <p className="text-metadata text-on-surface-variant">{field.help}</p>}
          </div>
        ) : (
        <div key={field.name} className="space-y-1.5">
          {field.type !== "checkbox" && (
            <label htmlFor={field.name} className="text-label-sm text-on-surface">
              {field.label}
              {field.required && <span className="text-error"> *</span>}
            </label>
          )}

          {field.type === "textarea" ? (
            <textarea
              id={field.name}
              name={field.name}
              required={field.required}
              rows={4}
              defaultValue={defaultTextValue(field, initialValues?.[field.name])}
              className={inputClass}
            />
          ) : field.type === "select" ? (
            <select
              id={field.name}
              name={field.name}
              required={field.required}
              defaultValue={defaultTextValue(field, initialValues?.[field.name]) ?? ""}
              className={selectClass}
            >
              <option value="" disabled>
                {t("selectPlaceholder")}
              </option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <label className="text-body-md flex items-center gap-2 text-on-surface">
              <input
                id={field.name}
                name={field.name}
                type="checkbox"
                defaultChecked={Boolean(initialValues?.[field.name])}
                className="h-4 w-4 rounded border-2 border-border-muted text-primary focus:ring-primary"
              />
              {field.label}
            </label>
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              required={field.required}
              placeholder={field.placeholder}
              step={field.type === "number" ? "any" : undefined}
              defaultValue={defaultTextValue(field, initialValues?.[field.name])}
              className={inputClass}
            />
          )}

          {field.help && <p className="text-metadata text-on-surface-variant">{field.help}</p>}
        </div>
      ))}

      {error && <p className="text-body-md text-error">{error}</p>}

      <Button type="submit" disabled={Boolean(submitting)} className="rounded-xl">
        {submitting ? t("saving") : isEdit ? t("saveChanges") : t("saveLabel", { label })}
      </Button>
    </form>
  );
}
