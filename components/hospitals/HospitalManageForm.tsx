"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ImageUploader } from "@/components/common/ImageUploader";
import { HospitalDoctorsManager } from "@/components/hospitals/HospitalDoctorsManager";
import { Button } from "@/components/ui/button";
import {
  inputClass,
  labelClass,
  selectClass,
} from "@/components/ui/field-styles";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { HospitalAdmin, HospitalType } from "@/types/api";

interface Option {
  value: string;
  label: string;
}

const MAX_IMAGES = 5;
const HOSPITAL_TYPES: HospitalType[] = ["govt", "private", "clinic"];

/** The one hospital an admin-granted owner manages (Section 17 follow-up):
 * fetches `/hospitals/mine` to decide create vs. edit, same "mine" convention
 * as MyPlaces.tsx's `places/mine`. */
export function HospitalManageForm({ locations }: { locations: Option[] }) {
  const t = useTranslations("sellHospital");
  const tType = useTranslations("hospitalType");
  const router = useRouter();
  const { handleAuthError } = useAuthModal();
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));

  const [hospital, setHospital] = useState<HospitalAdmin | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    clientApi
      .get<HospitalAdmin | null>("hospitals/mine")
      .then(setHospital)
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
    const images = text("gallery")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const services = text("services")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      location_id: text("location_id"),
      name_bn: text("name"),
      type: text("type"),
      address: text("address") || null,
      contact: text("contact") || null,
      ambulance_contact: text("ambulance_contact") || null,
      services,
      images,
      latitude: text("latitude") ? Number(text("latitude")) : null,
      longitude: text("longitude") ? Number(text("longitude")) : null,
    };

    submit(payload);
  }

  function submit(payload: Record<string, unknown>) {
    // POST/PATCH return the public HospitalResponse shape (localized `name`),
    // not HospitalAdminResponse (`name_bn`/`name_en`/`name_ar`) that this form
    // reads its fields from - refetch `mine` instead of trusting the response.
    void run(
      () =>
        hospital
          ? clientApi.patch(`hospitals/${hospital.id}`, payload)
          : clientApi.post("hospitals", payload),
      {
        onSuccess: async () => {
          await clientApi
            .get<HospitalAdmin | null>("hospitals/mine")
            .then(setHospital);
          router.refresh();
        },
        onError: (err) => handleAuthError(err, () => submit(payload)),
      },
    );
  }

  if (hospital === undefined && !loadError) {
    return (
      <div
        className="h-64 animate-pulse rounded-xl bg-surface-container"
        aria-hidden="true"
      />
    );
  }
  if (loadError) return <p className="text-body-md text-error">{loadError}</p>;

  return (
    <div className="space-y-8">
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
            defaultValue={hospital?.name_bn}
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
              defaultValue={hospital?.type ?? ""}
              className={selectClass}
            >
              <option value="" disabled>
                {t("selectPlaceholder")}
              </option>
              {HOSPITAL_TYPES.map((type) => (
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
              defaultValue={hospital?.location_id ?? ""}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="contact" className={labelClass}>
              {t("hotlineLabel")}
            </label>
            <input
              id="contact"
              name="contact"
              maxLength={100}
              defaultValue={hospital?.contact ?? ""}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="ambulance_contact" className={labelClass}>
              {t("ambulanceLabel")}
            </label>
            <input
              id="ambulance_contact"
              name="ambulance_contact"
              maxLength={100}
              defaultValue={hospital?.ambulance_contact ?? ""}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="address" className={labelClass}>
            {t("addressLabel")}
          </label>
          <input
            id="address"
            name="address"
            maxLength={500}
            defaultValue={hospital?.address ?? ""}
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="services" className={labelClass}>
            {t("servicesLabel")}
          </label>
          <input
            id="services"
            name="services"
            defaultValue={hospital?.services?.join(", ") ?? ""}
            className={inputClass}
            placeholder={t("servicesPlaceholder")}
          />
          <p className="text-metadata text-on-surface-variant">
            {t("servicesHelp")}
          </p>
        </div>

        <ImageUploader
          name="gallery"
          max={MAX_IMAGES}
          defaultValue={hospital?.images ?? []}
          label={t("imagesLabel")}
          helpText={t("imagesHelp", { count: MAX_IMAGES })}
        />

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
                defaultValue={hospital?.latitude ?? undefined}
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
                defaultValue={hospital?.longitude ?? undefined}
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
            : hospital
              ? t("updateLabel")
              : t("submitLabel")}
        </Button>
      </form>

      {hospital && <HospitalDoctorsManager hospitalId={hospital.id} />}
    </div>
  );
}
