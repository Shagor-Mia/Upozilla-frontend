"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass, selectClass } from "@/components/ui/field-styles";
import { trackEvent } from "@/lib/analytics";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { Business, Listing, ListingType, MarketplaceCategory } from "@/types/api";

interface Option {
  value: string;
  label: string;
}

/** Create form shared by /sell/exchange and /sell/marketplace. Photos are URL
 * inputs for now - an upload/image CDN account is a later setup step.
 *
 * The page itself is public - anyone can open and fill this form signed out.
 * Submitting while unauthenticated or phone-unverified opens the in-place
 * auth modal and resubmits the exact same payload once that's resolved,
 * instead of bouncing to a separate page and losing the form. */
export function ListingForm({
  listingType,
  categories,
  locations,
  businesses = [],
}: {
  listingType: ListingType;
  categories: MarketplaceCategory[];
  locations: Option[];
  businesses?: Business[];
}) {
  const t = useTranslations("listingForm");
  const router = useRouter();
  const { handleAuthError } = useAuthModal();
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));

  async function submit(payload: Record<string, unknown>) {
    await run(
      () =>
        listingType === "exchange"
          ? clientApi.post<Listing>("exchange/listings", payload)
          : clientApi.post<Listing>("marketplace/products", payload),
      {
        onSuccess: (created) => {
          trackEvent({
            event: "listing_created",
            listing_type: listingType,
            category: created.category_name,
            value: created.price,
          });
          router.push("/account/listings?created=1");
          router.refresh();
        },
        onError: (err) => handleAuthError(err, () => submit(payload)),
      }
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const images = text("images")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const base = {
      category_id: text("category_id"),
      location_id: text("location_id"),
      title: text("title"),
      description: text("description") || null,
      price: Number(text("price")),
      condition: text("condition"),
      images,
      latitude: text("latitude") ? Number(text("latitude")) : null,
      longitude: text("longitude") ? Number(text("longitude")) : null,
    };

    const payload =
      listingType === "exchange"
        ? { ...base, is_negotiable: formData.get("is_negotiable") === "on" }
        : { ...base, business_id: text("business_id") || null };

    void submit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="title" className={labelClass}>
          {t("titleLabel")} <span className="text-error">*</span>
        </label>
        <input id="title" name="title" required minLength={3} maxLength={200} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="category_id" className={labelClass}>
            {t("categoryLabel")} <span className="text-error">*</span>
          </label>
          <select id="category_id" name="category_id" required defaultValue="" className={selectClass}>
            <option value="" disabled>
              {t("selectPlaceholder")}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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
          <label htmlFor="price" className={labelClass}>
            {t("priceLabel")} <span className="text-error">*</span>
          </label>
          <input id="price" name="price" type="number" min={0} step="1" required className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="condition" className={labelClass}>
            {t("conditionLabel")} <span className="text-error">*</span>
          </label>
          <select
            id="condition"
            name="condition"
            required
            defaultValue={listingType === "exchange" ? "used" : "new"}
            className={selectClass}
          >
            <option value="new">{t("conditionNew")}</option>
            <option value="used">{t("conditionUsed")}</option>
          </select>
        </div>
      </div>

      {listingType === "exchange" ? (
        <label className="text-body-md flex items-center gap-2 text-on-surface">
          <input name="is_negotiable" type="checkbox" className="h-4 w-4 rounded border-2 border-border-muted" />
          {t("priceNegotiableLabel")}
        </label>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="business_id" className={labelClass}>
            {t("businessLabel")}
          </label>
          <select id="business_id" name="business_id" defaultValue="" className={selectClass}>
            <option value="">{t("sellAsMyself")}</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
          <p className="text-metadata text-on-surface-variant">
            {t("businessHelp")}
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClass}>
          {t("descriptionLabel")}
        </label>
        <textarea id="description" name="description" rows={5} maxLength={5000} className={inputClass} />
      </div>

      <ImageUploader name="images" max={8} label={t("imagesLabel")} helpText={t("imagesHelp", { count: 8 })} />

      <details className="rounded-xl border border-border-muted p-4">
        <summary className="text-label-sm cursor-pointer text-on-surface">{t("mapPinLabel")}</summary>
        <div className="mt-3 grid grid-cols-2 gap-4">
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
            <input id="longitude" name="longitude" type="number" step="any" min={-180} max={180} className={inputClass} />
          </div>
        </div>
      </details>

      {error && <p className="text-body-md text-error">{error}</p>}

      <Button type="submit" size="lg" disabled={Boolean(submitting)} className="rounded-xl">
        {submitting ? t("submitting") : t("submitForReview")}
      </Button>
    </form>
  );
}
