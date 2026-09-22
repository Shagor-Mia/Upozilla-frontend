"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass, selectClass } from "@/components/ui/field-styles";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { Contract, ContractCreate, UserLookup } from "@/types/api";

const MAX_REFERENCE_IMAGES = 5;
const PAYMENT_TYPES: ContractCreate["payment_type"][] = ["fixed", "hourly", "daily", "milestone"];

function paymentTypeLabel(t: (key: string) => string, type: ContractCreate["payment_type"]) {
  switch (type) {
    case "hourly":
      return t("paymentTypeHourly");
    case "daily":
      return t("paymentTypeDaily");
    case "milestone":
      return t("paymentTypeMilestone");
    default:
      return t("paymentTypeFixed");
  }
}

/** Modeled on `ListingForm.tsx` (FormData-based, uncontrolled fields) plus the
 * worker phone-lookup flow from the Flutter app's `create_contract_screen.dart` -
 * a `worker_user_id` must be resolved (either passed in from a CTA, or looked
 * up by phone) before the rest of the form can be submitted. */
export function CreateContractForm({
  defaultWorkerId,
  defaultWorkerName,
}: {
  defaultWorkerId?: string;
  defaultWorkerName?: string;
}) {
  const t = useTranslations("contractForm");
  const router = useRouter();
  const { handleAuthError } = useAuthModal();
  const { run, pending: submitting, error, setError } = useApiMutation(t("errorGeneric"));

  const [workerId, setWorkerId] = useState<string | null>(defaultWorkerId ?? null);
  const [workerName, setWorkerName] = useState<string | null>(defaultWorkerName ?? null);
  const [workerPhone, setWorkerPhone] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  async function lookupWorker() {
    setLookupError(null);
    setLookingUp(true);
    try {
      const found = await clientApi.get<UserLookup>(`users/lookup?phone=${encodeURIComponent(workerPhone.trim())}`);
      setWorkerId(found.id);
      setWorkerName(found.full_name);
    } catch (err) {
      if (err instanceof ClientApiError && err.status === 404) {
        setLookupError(t("workerNotFound"));
      } else if (!handleAuthError(err, lookupWorker)) {
        setLookupError(err instanceof ClientApiError ? err.message : t("workerNotFound"));
      }
    } finally {
      setLookingUp(false);
    }
  }

  async function submit(payload: ContractCreate) {
    await run(() => clientApi.post<Contract>("contracts", payload), {
      onSuccess: (contract) => router.push(`/contracts/${contract.id}`),
      onError: (err) => handleAuthError(err, () => submit(payload)),
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workerId) {
      setLookupError(t("workerNotFound"));
      return;
    }
    setError(null);
    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const images = text("reference_images")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    void submit({
      worker_user_id: workerId,
      title: text("title"),
      description: text("description"),
      payment_amount: Number(text("payment_amount")),
      payment_type: text("payment_type") as ContractCreate["payment_type"],
      currency: text("currency") || "BDT",
      start_date: text("start_date") || null,
      end_date: text("end_date") || null,
      reference_images: images,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="worker_phone" className={labelClass}>
          {t("workerPhoneLabel")} <span className="text-error">*</span>
        </label>
        {workerId ? (
          <div className="flex items-center justify-between rounded-xl border-2 border-border-muted px-4 py-2.5">
            <span className="text-body-md text-on-surface">{t("workerFound", { name: workerName ?? "" })}</span>
            <button
              type="button"
              onClick={() => {
                setWorkerId(null);
                setWorkerName(null);
                setWorkerPhone("");
              }}
              className="text-label-sm text-primary hover:underline"
            >
              {t("change")}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id="worker_phone"
              type="tel"
              value={workerPhone}
              onChange={(e) => setWorkerPhone(e.target.value)}
              placeholder={t("phoneHint")}
              className={inputClass}
            />
            <Button type="button" onClick={() => void lookupWorker()} disabled={lookingUp || !workerPhone.trim()}>
              {lookingUp ? t("lookingUp") : t("findWorker")}
            </Button>
          </div>
        )}
        {lookupError && <p className="text-body-md text-error">{lookupError}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className={labelClass}>
          {t("titleLabel")} <span className="text-error">*</span>
        </label>
        <input id="title" name="title" required minLength={3} maxLength={200} className={inputClass} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClass}>
          {t("descriptionLabel")} <span className="text-error">*</span>
        </label>
        <textarea id="description" name="description" required minLength={3} rows={5} maxLength={5000} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="payment_amount" className={labelClass}>
            {t("paymentAmountLabel")} <span className="text-error">*</span>
          </label>
          <input
            id="payment_amount"
            name="payment_amount"
            type="number"
            min={0.01}
            step="0.01"
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="payment_type" className={labelClass}>
            {t("paymentTypeLabel")}
          </label>
          <select id="payment_type" name="payment_type" defaultValue="fixed" className={selectClass}>
            {PAYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {paymentTypeLabel(t, type)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="currency" className={labelClass}>
            {t("currencyLabel")}
          </label>
          <input id="currency" name="currency" defaultValue="BDT" maxLength={3} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="start_date" className={labelClass}>
            {t("startDateLabel")}
          </label>
          <input id="start_date" name="start_date" type="date" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="end_date" className={labelClass}>
            {t("endDateLabel")}
          </label>
          <input id="end_date" name="end_date" type="date" className={inputClass} />
        </div>
      </div>

      <ImageUploader
        name="reference_images"
        max={MAX_REFERENCE_IMAGES}
        label={t("referenceImagesLabel")}
        helpText={t("referenceImagesHelp", { count: MAX_REFERENCE_IMAGES })}
      />

      {error && <p className="text-body-md text-error">{error}</p>}

      <Button type="submit" size="lg" disabled={Boolean(submitting)} className="rounded-xl">
        {submitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
