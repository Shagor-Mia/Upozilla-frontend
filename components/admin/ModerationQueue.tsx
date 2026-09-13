"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ListingImage } from "@/components/listings/ListingImage";
import { StatusChip } from "@/components/listings/StatusChip";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field-styles";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { formatPrice, formatRelativeTime, listingHref } from "@/lib/format";
import { useApiMutation } from "@/lib/use-api-mutation";
import { cn } from "@/lib/utils";
import type { ModerationQueueItem, ModerationQueueStatus, ModerationStats, Paginated } from "@/types/api";

const TABS: { value: ModerationQueueStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function fetchQueue(tab: ModerationQueueStatus) {
  return Promise.all([
    clientApi.get<Paginated<ModerationQueueItem>>(`moderation/queue?status=${tab}&page_size=60`),
    clientApi.get<ModerationStats>("moderation/stats"),
  ]);
}

/** Section 12 moderation screen: listings + reports awaiting a
 * marketplace_moderator decision. Approve/reject write an audit log entry. */
export function ModerationQueue() {
  const [tab, setTab] = useState<ModerationQueueStatus>("pending");
  // Keyed by tab so switching tabs shows the skeleton until that tab's data lands.
  const [loaded, setLoaded] = useState<{ tab: ModerationQueueStatus; items: ModerationQueueItem[] } | null>(null);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { run, pending: busyId, error, setError } = useApiMutation("Something went wrong");
  const items = loaded?.tab === tab ? loaded.items : null;

  const load = useCallback(
    () =>
      fetchQueue(tab)
        .then(([queue, counts]) => {
          setLoaded({ tab, items: queue.items });
          setStats(counts);
        })
        .catch((err) => setError(err instanceof ClientApiError ? err.message : "Could not load the queue")),
    [tab, setError]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function review(item: ModerationQueueItem, decision: "approve" | "reject") {
    await run(() => clientApi.post(`moderation/queue/${item.id}/review`, { decision, note: notes[item.id]?.trim() || null }), {
      key: item.id,
      fallbackError: "Could not save the decision",
      onSuccess: load,
    });
  }

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-2">
        {TABS.map((option) => (
          <button
            key={option.value}
            role="tab"
            type="button"
            aria-selected={tab === option.value}
            onClick={() => setTab(option.value)}
            className={cn(
              "text-label-sm rounded-full border px-4 py-1.5 transition-colors",
              tab === option.value
                ? "border-admin-blue bg-admin-blue text-white"
                : "border-border-muted bg-surface-container-lowest text-on-surface-variant hover:border-admin-blue"
            )}
          >
            {option.label}
            {stats && <span className="ms-1 opacity-80">({stats[option.value]})</span>}
          </button>
        ))}
      </div>

      {error && <p className="text-body-md text-error">{error}</p>}

      {items === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-surface-container" aria-hidden="true" />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
          <p className="text-body-md text-on-surface-variant">Nothing {tab} right now.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const busy = busyId === item.id;
            const isReport = item.entity_type === "listing_report";
            const href = item.listing
              ? listingHref(item.listing.listing_type, item.entity_id)
              : item.report
                ? listingHref(item.report.listing_type, item.report.listing_id)
                : null;
            return (
              <li
                key={item.id}
                className="rounded-xl border border-border-muted bg-surface-container-lowest p-4 shadow-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row">
                  {item.listing && (
                    <ListingImage src={item.listing.cover_image ?? undefined} alt="" sizes="112px" className="w-full sm:w-28 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip status={isReport ? "open" : item.status} label={isReport ? "Report" : item.entity_type.replace("_", " ")} />
                      {item.location_name && <span className="text-metadata text-on-surface-variant">{item.location_name}</span>}
                      <span className="text-metadata text-on-surface-variant">{formatRelativeTime(item.created_at)}</span>
                    </div>
                    {item.listing && (
                      <>
                        <p className="text-body-md font-semibold text-on-surface">
                          {href ? (
                            <Link href={href} target="_blank" className="hover:text-primary">
                              {item.listing.title}
                            </Link>
                          ) : (
                            item.listing.title
                          )}
                        </p>
                        <p className="text-metadata text-on-surface-variant">
                          {formatPrice(item.listing.price, item.listing.currency)} · seller {item.listing.seller_name} · {item.reason}
                        </p>
                        {item.listing.description && (
                          <p className="text-body-md line-clamp-3 text-on-surface-variant">{item.listing.description}</p>
                        )}
                      </>
                    )}
                    {item.report && (
                      <>
                        <p className="text-body-md font-semibold text-on-surface">
                          {item.report.reason.replace(/_/g, " ")} —{" "}
                          {href ? (
                            <Link href={href} target="_blank" className="hover:text-primary">
                              {item.report.listing_title ?? "listing"}
                            </Link>
                          ) : (
                            (item.report.listing_title ?? "listing")
                          )}
                        </p>
                        <p className="text-metadata text-on-surface-variant">
                          Reported by {item.report.reporter_name} · listing status {item.report.listing_status ?? "unknown"}
                        </p>
                        {item.report.details && <p className="text-body-md text-on-surface-variant">{item.report.details}</p>}
                      </>
                    )}
                    {item.review_note && (
                      <p className="text-metadata text-on-surface-variant">Note: {item.review_note}</p>
                    )}
                  </div>
                </div>

                {item.status === "pending" && (
                  <div className="mt-4 flex flex-col gap-2 border-t border-border-muted pt-4 sm:flex-row sm:items-center">
                    <input
                      value={notes[item.id] ?? ""}
                      onChange={(e) => setNotes((current) => ({ ...current, [item.id]: e.target.value }))}
                      placeholder="Note (optional)"
                      aria-label="Review note"
                      className={cn(inputClass, "sm:flex-1")}
                    />
                    <div className="flex gap-2">
                      <Button disabled={busy} onClick={() => review(item, "approve")}>
                        {isReport ? "Uphold & hide listing" : "Approve"}
                      </Button>
                      <Button variant="destructive" disabled={busy} onClick={() => review(item, "reject")}>
                        {isReport ? "Dismiss" : "Reject"}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
