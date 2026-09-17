"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { inputClass, labelClass } from "@/components/ui/field-styles";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { Doctor } from "@/types/api";

/** Doctor roster for the one hospital an owner manages - only add + list exist
 * on the backend (GET/POST /hospitals/{id}/doctors), no edit/delete yet. */
export function HospitalDoctorsManager({ hospitalId }: { hospitalId: string }) {
  const t = useTranslations("hospitalDoctors");
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));

  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  function reload() {
    return clientApi
      .get<Doctor[]>(`hospitals/${hospitalId}/doctors`)
      .then(setDoctors)
      .catch((err) =>
        setLoadError(
          err instanceof ClientApiError ? err.message : t("errorGeneric"),
        ),
      );
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const chamber_days = text("chamber_days")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    void run(
      () =>
        clientApi.post<Doctor>(`hospitals/${hospitalId}/doctors`, {
          hospital_id: hospitalId,
          name: text("name"),
          specialty: text("specialty") || null,
          chamber_days: chamber_days.length > 0 ? chamber_days : null,
          chamber_hours: text("chamber_hours") || null,
          contact: text("contact") || null,
        }),
      {
        onSuccess: async () => {
          form.reset();
          await reload();
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-headline-md text-on-surface">{t("heading")}</h2>

      {loadError && <p className="text-body-md text-error">{loadError}</p>}

      {doctors && doctors.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-headline-md">
                  {doctor.name}
                </CardTitle>
                {doctor.specialty && (
                  <Badge variant="secondary" className="w-fit">
                    {doctor.specialty}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-1 text-body-md text-on-surface-variant">
                {doctor.chamber_days && (
                  <p>
                    {t("doctorDays", { days: doctor.chamber_days.join(", ") })}
                  </p>
                )}
                {doctor.chamber_hours && (
                  <p>{t("doctorHours", { hours: doctor.chamber_hours })}</p>
                )}
                {doctor.contact && (
                  <p>{t("doctorContact", { contact: doctor.contact })}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {doctors && doctors.length === 0 && (
        <p className="text-body-md text-on-surface-variant">{t("empty")}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border-muted p-4"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="doctor_name" className={labelClass}>
              {t("nameLabel")} <span className="text-error">*</span>
            </label>
            <input
              id="doctor_name"
              name="name"
              required
              minLength={2}
              maxLength={255}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="doctor_specialty" className={labelClass}>
              {t("specialtyLabel")}
            </label>
            <input
              id="doctor_specialty"
              name="specialty"
              maxLength={255}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="chamber_days" className={labelClass}>
              {t("daysLabel")}
            </label>
            <input
              id="chamber_days"
              name="chamber_days"
              className={inputClass}
              placeholder={t("daysPlaceholder")}
            />
            <p className="text-metadata text-on-surface-variant">
              {t("daysHelp")}
            </p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="chamber_hours" className={labelClass}>
              {t("hoursLabel")}
            </label>
            <input
              id="chamber_hours"
              name="chamber_hours"
              maxLength={100}
              className={inputClass}
              placeholder={t("hoursPlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="doctor_contact" className={labelClass}>
            {t("contactLabel")}
          </label>
          <input
            id="doctor_contact"
            name="contact"
            maxLength={100}
            className={inputClass}
          />
        </div>

        {error && <p className="text-body-md text-error">{error}</p>}

        <Button
          type="submit"
          disabled={Boolean(submitting)}
          className="rounded-xl"
        >
          {submitting ? t("adding") : t("addLabel")}
        </Button>
      </form>
    </div>
  );
}
