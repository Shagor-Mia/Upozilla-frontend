"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass, selectClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { Business } from "@/types/api";

interface Option {
  value: string;
  label: string;
}

const MAX_IMAGES = 3;

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ঀ-৿]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "business"}-${suffix}`;
}

/** Public submission form (POST /businesses) - any logged-in user, no phone
 * verification. Unlike PlaceForm, there is no moderation queue for
 * businesses: this publishes immediately (product decision), so the page
 * gates on sign-in only via TrustGate. */
export function BusinessForm({ categories, locations }: { categories: Option[]; locations: Option[] }) {
  const t = useTranslations("businessForm");
  const router = useRouter();
  const { handleAuthError } = useAuthModal();
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));

  async function submit(payload: Record<string, unknown>) {
    await run(() => clientApi.post<Business>("businesses", payload), {
      onSuccess: (business) => {
        router.push(`/popular-services/${business.slug}`);
        router.refresh();
      },
      onError: (err) => handleAuthError(err, () => submit(payload)),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const name = text("name");
    const images = text("gallery")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    void submit({
      location_id: text("location_id"),
      category: text("category"),
      name_bn: name,
      slug: slugify(name),
      description_bn: text("description") || null,
      phone: text("phone") || null,
      address: text("address") || null,
      images,
      latitude: text("latitude") ? Number(text("latitude")) : null,
      longitude: text("longitude") ? Number(text("longitude")) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className={labelClass}>
          {t("nameLabel")} <span className="text-error">*</span>
        </label>
        <input id="name" name="name" required minLength={2} maxLength={255} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="category" className={labelClass}>
            {t("categoryLabel")} <span className="text-error">*</span>
          </label>
          <select id="category" name="category" required defaultValue="" className={selectClass}>
            <option value="" disabled>
              {t("selectPlaceholder")}
            </option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="location_id" className={labelClass}>
            {t("locationLabel")} <span className="text-error">*</span>
          </label>
          <select id="location_id" name="location_id" required defaultValue="" className={selectClass}>
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
          <label htmlFor="phone" className={labelClass}>
            {t("phoneLabel")}
          </label>
          <input id="phone" name="phone" maxLength={20} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="address" className={labelClass}>
            {t("addressLabel")}
          </label>
          <input id="address" name="address" maxLength={500} className={inputClass} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClass}>
          {t("descriptionLabel")}
        </label>
        <textarea id="description" name="description" rows={5} maxLength={5000} className={inputClass} />
      </div>

      <ImageUploader
        name="gallery"
        max={MAX_IMAGES}
        label={t("imagesLabel")}
        helpText={t("imagesHelp", { count: MAX_IMAGES })}
      />

      <details className="rounded-xl border border-border-muted p-4">
        <summary className="text-label-sm cursor-pointer text-on-surface">{t("mapPinLabel")}</summary>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="latitude" className={labelClass}>
              {t("latitudeLabel")}
            </label>
            <input id="latitude" name="latitude" type="number" step="any" min={-90} max={90} className={inputClass} />
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
              className={inputClass}
            />
          </div>
        </div>
      </details>

      {error && <p className="text-body-md text-error">{error}</p>}

      <Button type="submit" size="lg" disabled={Boolean(submitting)} className="rounded-xl">
        {submitting ? t("submitting") : t("submitLabel")}
      </Button>
    </form>
  );
}
