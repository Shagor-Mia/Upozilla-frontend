"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";
import {
  inputClass,
  labelClass,
  selectClass,
} from "@/components/ui/field-styles";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { SchoolAdmin, SchoolType } from "@/types/api";

interface Option {
  value: string;
  label: string;
}

const SCHOOL_TYPES: SchoolType[] = ["govt", "private", "madrasa", "college", "other"];

/** The one school an admin-granted owner manages (Section 17 follow-up):
 * fetches `/schools/mine` to decide create vs. edit, same "mine" convention
 * as HospitalManageForm.tsx. */
export function SchoolManageForm({ locations }: { locations: Option[] }) {
  const t = useTranslations("sellSchool");
  const tType = useTranslations("schoolType");
  const router = useRouter();
  const { handleAuthError } = useAuthModal();
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));

  const [school, setSchool] = useState<SchoolAdmin | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    clientApi
      .get<SchoolAdmin | null>("schools/mine")
      .then(setSchool)
      .catch((err) =>
        setLoadError(
          err instanceof ClientApiError ? err.message : t("errorGeneric"),
        ),
      );
  }, [t]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "").trim();

    const payload = {
      location_id: text("location_id"),
      name_bn: text("name"),
      type: text("type"),
      address: text("address") || null,
      contact: text("contact") || null,
      latitude: text("latitude") ? Number(text("latitude")) : null,
      longitude: text("longitude") ? Number(text("longitude")) : null,
    };

    submit(payload);
  }

  function submit(payload: Record<string, unknown>) {
    // POST/PATCH return the public SchoolResponse shape (localized `name`),
    // not SchoolAdmin (`name_bn`/`name_en`/`name_ar`) that this form
    // reads its fields from - refetch `mine` instead of trusting the response.
    void run(
      () =>
        school
          ? clientApi.patch(`schools/${school.id}`, payload)
          : clientApi.post("schools", payload),
      {
        onSuccess: async () => {
          await clientApi
            .get<SchoolAdmin | null>("schools/mine")
            .then(setSchool);
          router.refresh();
        },
        onError: (err) => handleAuthError(err, () => submit(payload)),
      },
    );
  }

  if (school === undefined && !loadError) {
    return (
      <div
        className="h-64 animate-pulse rounded-xl bg-surface-container"
        aria-hidden="true"
      />
    );
  }
  if (loadError) return <p className="text-body-md text-error">{loadError}</p>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className={labelClass}>
          {t("nameLabel")} <span className="text-error">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={255}
          defaultValue={school?.name_bn}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="type" className={labelClass}>
            {t("typeLabel")} <span className="text-error">*</span>
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={school?.type ?? ""}
            className={selectClass}
          >
            <option value="" disabled>
              {t("selectPlaceholder")}
            </option>
            {SCHOOL_TYPES.map((type) => (
              <option key={type} value={type}>
                {tType(type)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="location_id" className={labelClass}>
            {t("locationLabel")} <span className="text-error">*</span>
          </label>
          <select
            id="location_id"
            name="location_id"
            required
            defaultValue={school?.location_id ?? ""}
            className={selectClass}
          >
            <option value="" disabled>
              {t("selectPlaceholder")}
            </option>
            {locations.map((location) => (
              <option key={location.value} value={location.value}>
                {location.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="contact" className={labelClass}>
          {t("contactLabel")}
        </label>
        <input
          id="contact"
          name="contact"
          maxLength={100}
          defaultValue={school?.contact ?? ""}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="address" className={labelClass}>
          {t("addressLabel")}
        </label>
        <input
          id="address"
          name="address"
          maxLength={500}
          defaultValue={school?.address ?? ""}
          className={inputClass}
        />
      </div>

      <details className="rounded-xl border border-border-muted p-4">
        <summary className="text-label-sm cursor-pointer text-on-surface">
          {t("mapPinLabel")}
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="latitude" className={labelClass}>
              {t("latitudeLabel")}
            </label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              min={-90}
              max={90}
              defaultValue={school?.latitude ?? undefined}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="longitude" className={labelClass}>
              {t("longitudeLabel")}
            </label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              min={-180}
              max={180}
              defaultValue={school?.longitude ?? undefined}
              className={inputClass}
            />
          </div>
        </div>
      </details>

      {error && <p className="text-body-md text-error">{error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={Boolean(submitting)}
        className="rounded-xl"
      >
        {submitting
          ? t("submitting")
          : school
            ? t("updateLabel")
            : t("submitLabel")}
      </Button>
    </form>
  );
}
