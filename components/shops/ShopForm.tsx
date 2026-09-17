"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass, selectClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { Shop, ShopCategory } from "@/types/api";

interface Option {
  value: string;
  label: string;
}

/** "সেল করুন > দোকান" - shopkeeper self-submits a shop, either as a stall
 * inside a market or standalone anywhere in the upazila, same moderation
 * queue lifecycle as marketplace/exchange listings.
 *
 * The page is public - anyone can open and fill this form signed out.
 * Submitting while unauthenticated or phone-unverified opens the in-place
 * auth modal and resubmits the same payload once that's resolved. */
export function ShopForm({
  markets,
  categories: initialCategories,
  locations,
}: {
  markets: Option[];
  categories: ShopCategory[];
  locations: Option[];
}) {
  const t = useTranslations("shopForm");
  const router = useRouter();
  const { handleAuthError } = useAuthModal();
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));
  const [marketId, setMarketId] = useState("");
  const [categories, setCategories] = useState(initialCategories);
  const [categoryId, setCategoryId] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const { run: runAddCategory, pending: addingCategoryPending } = useApiMutation(t("errorGeneric"));

  async function submit(payload: Record<string, unknown>) {
    await run(() => clientApi.post<Shop>("shops", payload), {
      onSuccess: () => {
        router.push("/account/shops?created=1");
        router.refresh();
      },
      onError: (err) => handleAuthError(err, () => submit(payload)),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const images = text("images")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    void submit({
      market_id: marketId || null,
      location_id: marketId ? null : text("location_id"),
      category_id: categoryId,
      name: text("name"),
      description: text("description") || null,
      contact_phone: text("contact_phone") || null,
      images,
    });
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    await runAddCategory(() => clientApi.post<ShopCategory>("shops/categories", { name_bn: name }), {
      onSuccess: (category) => {
        setCategories((prev) => [...prev, category]);
        setCategoryId(category.id);
        setNewCategoryName("");
        setAddingCategory(false);
      },
      onError: (err) => handleAuthError(err, handleAddCategory),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="name" className={labelClass}>
          {t("nameLabel")} <span className="text-error">*</span>
        </label>
        <input id="name" name="name" required minLength={2} maxLength={200} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="market_id" className={labelClass}>
            {t("marketLabel")}
          </label>
          <select
            id="market_id"
            name="market_id"
            value={marketId}
            onChange={(event) => setMarketId(event.target.value)}
            className={selectClass}
          >
            <option value="">{t("noMarketOption")}</option>
            {markets.map((market) => (
              <option key={market.value} value={market.value}>
                {market.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="category_id" className={labelClass}>
            {t("categoryLabel")} <span className="text-error">*</span>
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className={selectClass}
          >
            <option value="" disabled>
              {t("selectPlaceholder")}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {addingCategory ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder={t("newCategoryNameLabel")}
                minLength={2}
                maxLength={100}
                className={inputClass}
              />
              <Button
                type="button"
                size="sm"
                disabled={Boolean(addingCategoryPending) || newCategoryName.trim().length < 2}
                onClick={handleAddCategory}
                className="rounded-lg"
              >
                {t("addCategoryConfirm")}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setAddingCategory(false);
                  setNewCategoryName("");
                }}
                className="text-label-sm text-on-surface-variant hover:text-primary"
              >
                {t("addCategoryCancel")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="text-label-sm text-primary hover:underline"
            >
              {t("addCategory")}
            </button>
          )}
        </div>
      </div>

      {!marketId && (
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
      )}

      <div className="space-y-1.5">
        <label htmlFor="contact_phone" className={labelClass}>
          {t("contactPhoneLabel")}
        </label>
        <input id="contact_phone" name="contact_phone" type="tel" maxLength={20} className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClass}>
          {t("descriptionLabel")}
        </label>
        <textarea id="description" name="description" rows={4} maxLength={2000} className={inputClass} />
      </div>

      <ImageUploader name="images" max={8} label={t("imagesLabel")} />

      {error && <p className="text-body-md text-error">{error}</p>}

      <Button type="submit" size="lg" disabled={Boolean(submitting)} className="rounded-xl">
        {submitting ? t("submitting") : t("submitForReview")}
      </Button>
    </form>
  );
}
