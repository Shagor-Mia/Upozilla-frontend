"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";

import { inputClass, labelClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";

interface UploadSignature {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
}

async function uploadFileToCloudinary(file: File): Promise<string> {
  const sig = await clientApi.post<UploadSignature>("uploads/signature");
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.api_key);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/auto/upload`, {
    method: "POST",
    body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data?.error?.message === "string" ? data.error.message : "upload failed");
  }
  return data.secure_url as string;
}

/** Direct-to-Cloudinary photo picker: files never transit our server, only a
 * short-lived signature does (`POST /uploads/signature`). Renders a hidden
 * `name` input with one URL per line so it drops into the existing
 * newline-parsed `images` form fields (ListingForm, ShopForm) unchanged. */
export function ImageUploader({
  name,
  defaultValue = [],
  max = 8,
  label,
  helpText,
}: {
  name: string;
  defaultValue?: string[];
  max?: number;
  label: string;
  helpText?: string;
}) {
  const t = useTranslations("common");
  const inputId = useId();
  const [urls, setUrls] = useState<string[]>(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const room = max - urls.length;
    const selected = Array.from(files).slice(0, Math.max(room, 0));
    if (selected.length === 0) return;

    setUploading(true);
    try {
      const uploaded = await Promise.all(selected.map(uploadFileToCloudinary));
      setUrls((prev) => [...prev, ...uploaded]);
    } catch {
      setError(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <input type="hidden" name={name} value={urls.join("\n")} readOnly />

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, index) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-border-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URLs, not a local asset */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label={t("removeImage")}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-inverse-surface text-inverse-on-surface"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < max && (
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
          className={inputClass}
        />
      )}

      {uploading && <p className="text-metadata text-on-surface-variant">{t("uploading")}</p>}
      {error && <p className="text-body-md text-error">{error}</p>}
      {helpText && <p className="text-metadata text-on-surface-variant">{helpText}</p>}
    </div>
  );
}
