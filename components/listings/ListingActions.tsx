"use client";

import { useTranslations } from "next-intl";
import { Flag, Heart, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { TrustGate } from "@/components/listings/TrustGate";
import { Button } from "@/components/ui/button";
import { selectClass } from "@/components/ui/field-styles";
import { trackEvent } from "@/lib/analytics";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";
import type { ContactReveal, Conversation, ListingType, ReportReason } from "@/types/api";

interface Session {
  userId: string;
  phoneVerified: boolean;
}

/**
 * Buyer-side actions on a listing detail page: favorite, reveal phone, message
 * the seller, report. Session state is fetched client-side (like AuthNav) so the
 * page itself stays cacheable; the backend re-checks every gate server-side.
 *
 * Anyone can browse this page signed out. Trying one of these actions opens
 * the in-place sign-in/verify-phone modal (AuthModalProvider) instead of
 * navigating away - on success the exact action is resumed automatically.
 */
export function ListingActions({
  listingType,
  listingId,
  sellerId,
  initialFavoritesCount,
}: {
  listingType: ListingType;
  listingId: string;
  /** Null once the seller's account has been deleted and this listing
   * anonymized (backend SET-NULLs `seller_user_id` rather than cascading). */
  sellerId: string | null;
  initialFavoritesCount: number;
}) {
  const t = useTranslations("listingActions");
  const router = useRouter();
  const { handleAuthError } = useAuthModal();

  const REPORT_REASONS: { value: ReportReason; label: string }[] = [
    { value: "spam", label: t("reportReasonSpam") },
    { value: "scam", label: t("reportReasonScam") },
    { value: "prohibited_item", label: t("reportReasonProhibitedItem") },
    { value: "wrong_category", label: t("reportReasonWrongCategory") },
    { value: "offensive", label: t("reportReasonOffensive") },
    { value: "duplicate", label: t("reportReasonDuplicate") },
    { value: "other", label: t("reportReasonOther") },
  ];
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [favorited, setFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(initialFavoritesCount);
  const [contact, setContact] = useState<ContactReveal | null>(null);
  const { run, pending: busy, error } = useApiMutation(t("couldNotUpdateFavorites"));
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  function loadSession() {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then(async (data: { session: Session | null }) => {
        if (cancelled) return;
        setSession(data.session);
        if (data.session) {
          const detailPath =
            listingType === "exchange" ? `exchange/listings/${listingId}` : `marketplace/products/${listingId}`;
          const detail = await clientApi
            .get<{ is_favorited: boolean; favorites_count: number }>(detailPath)
            .catch(() => null);
          if (detail && !cancelled) {
            setFavorited(detail.is_favorited);
            setFavoritesCount(detail.favorites_count);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setSession(null);
      });
    return () => {
      cancelled = true;
    };
  }

  useEffect(loadSession, [listingType, listingId]);

  /** Refreshes the cached session (so gateReason/TrustGate/"is this your
   * listing" all catch up) and, independently, retries `action` - `action`
   * itself never gates on the (still-stale-for-a-tick) `session` state, only
   * on the API's own 401/403, so this is safe to call before the refetch
   * resolves. */
  function refreshSessionThenRetry(action: () => void) {
    loadSession();
    action();
  }

  async function toggleFavorite() {
    await run(
      () => {
        const path = `exchange/favorites/${listingType}/${listingId}`;
        return favorited ? clientApi.delete(path) : clientApi.put(path);
      },
      {
        key: "favorite",
        fallbackError: t("couldNotUpdateFavorites"),
        onError: (err) => handleAuthError(err, () => refreshSessionThenRetry(toggleFavorite)),
        onSuccess: () => {
          setFavorited(!favorited);
          setFavoritesCount((count) => count + (favorited ? -1 : 1));
        },
      }
    );
  }

  async function revealContact() {
    const path =
      listingType === "exchange" ? `exchange/listings/${listingId}/contact` : `marketplace/products/${listingId}/contact`;
    await run(() => clientApi.post<ContactReveal>(path), {
      key: "contact",
      fallbackError: t("couldNotLoadContact"),
      onError: (err) => handleAuthError(err, () => refreshSessionThenRetry(revealContact)),
      onSuccess: (result) => {
        setContact(result);
        trackEvent({ event: "listing_contact_click", listing_type: listingType, listing_id: listingId });
      },
    });
  }

  async function messageSeller() {
    await run(
      () => clientApi.post<Conversation>("conversations", { listing_type: listingType, listing_id: listingId }),
      {
        key: "message",
        fallbackError: t("couldNotOpenConversation"),
        onError: (err) => handleAuthError(err, () => refreshSessionThenRetry(messageSeller)),
        onSuccess: (conversation) => {
          trackEvent({ event: "listing_contact_click", listing_type: listingType, listing_id: listingId });
          router.push(`/messages/${conversation.id}`);
        },
      }
    );
  }

  async function submitReport(reason: string, details: string | null) {
    await run(() => clientApi.post(`exchange/reports/${listingType}/${listingId}`, { reason, details }), {
      key: "report",
      fallbackError: t("couldNotSubmitReport"),
      onError: (err) => handleAuthError(err, () => refreshSessionThenRetry(() => submitReport(reason, details))),
      onSuccess: () => {
        setReported(true);
        setReporting(false);
      },
    });
  }

  function handleReportSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("reason") ?? "");
    const details = String(formData.get("details") ?? "").trim() || null;
    void submitReport(reason, details);
  }

  if (session === undefined) {
    return <div className="h-32 animate-pulse rounded-xl bg-surface-container" aria-hidden="true" />;
  }

  if (session?.userId === sellerId) {
    return (
      <div className="rounded-xl border border-border-muted bg-surface-container-low p-4">
        <p className="text-body-md text-on-surface">{t("thisIsYourListing")}</p>
        <Link href="/account/listings" className="text-label-sm text-primary hover:underline">
          {t("manageFromAccount")} →
        </Link>
      </div>
    );
  }

  // Anonymous visitors see these buttons active, not locked - clicking one
  // opens the sign-in modal in place and resumes the action. Only an
  // already-signed-in but unverified account is pre-locked here.
  const gateReason = session && !session.phoneVerified ? "verify" : null;

  return (
    <div className="space-y-4">
      <TrustGate locked={gateReason !== null} reason={gateReason ?? "signin"}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button size="lg" className="rounded-xl" onClick={messageSeller} disabled={busy !== false}>
            <MessageSquare data-icon="inline-start" />
            {busy === "message" ? t("opening") : t("messageSeller")}
          </Button>
          {contact ? (
            <a
              href={`tel:${contact.phone}`}
              className="text-label-sm flex h-9 items-center justify-center gap-1.5 rounded-xl border border-primary bg-primary/5 px-3 text-primary"
            >
              <Phone size={16} />
              {contact.phone}
            </a>
          ) : (
            <Button size="lg" variant="outline" className="rounded-xl" onClick={revealContact} disabled={busy !== false}>
              <Phone data-icon="inline-start" />
              {busy === "contact" ? t("loading") : t("showPhoneNumber")}
            </Button>
          )}
        </div>
      </TrustGate>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={favorited ? "secondary" : "ghost"}
          size="sm"
          onClick={toggleFavorite}
          disabled={busy === "favorite"}
          aria-pressed={favorited}
        >
          <Heart data-icon="inline-start" className={favorited ? "fill-current" : undefined} />
          {favorited ? t("saved") : t("save")} ({favoritesCount})
        </Button>
        {!reported && (
          <Button variant="ghost" size="sm" onClick={() => setReporting((open) => !open)}>
            <Flag data-icon="inline-start" />
            {t("report")}
          </Button>
        )}
        {reported && <span className="text-metadata text-on-surface-variant">{t("reportThanks")}</span>}
      </div>

      {reporting && (
        <form
          onSubmit={handleReportSubmit}
          className="space-y-3 rounded-xl border border-border-muted bg-surface-container-lowest p-4"
        >
          <label className="text-label-sm block text-on-surface">
            {t("reasonLabel")}
            <select name="reason" required className={`${selectClass} mt-1`} defaultValue="">
              <option value="" disabled>
                {t("selectPlaceholder")}
              </option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-label-sm block text-on-surface">
            {t("detailsOptional")}
            <textarea name="details" rows={3} maxLength={1000} className={`${selectClass} mt-1`} />
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy === "report"}>
              {busy === "report" ? t("sending") : t("submitReport")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setReporting(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}

      {error && <p className="text-body-md text-error">{error}</p>}
    </div>
  );
}
