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
import type { Shop, ShopCategory } from "@/types/api";

interface Option {
  value: string;
  label: string;
}

/** "সেল করুন > দোকান" - shopkeeper self-submits a shop inside a market, same
 * moderation-queue lifecycle as marketplace/exchange listings.
 *
 * The page is public - anyone can open and fill this form signed out.
 * Submitting while unauthenticated or phone-unverified opens the in-place
 * auth modal and resubmits the same payload once that's resolved. */
export function ShopForm({ markets, categories }: { markets: Option[]; categories: ShopCategory[] }) {
  const t = useTranslations("shopForm");
  const router = useRouter();
  const { handleAuthError } = useAuthModal();
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));

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
      market_id: text("market_id"),
      category_id: text("category_id"),
      name: text("name"),
      description: text("description") || null,
      contact_phone: text("contact_phone") || null,
      images,
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
            {t("marketLabel")} <span className="text-error">*</span>
          </label>
          <select id="market_id" name="market_id" required defaultValue="" className={selectClass}>
            <option value="" disabled>
              {t("selectPlaceholder")}
            </option>
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
      </div>

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
