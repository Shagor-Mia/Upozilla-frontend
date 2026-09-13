import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ListingImage } from "@/components/listings/ListingImage";
import { authApiGet } from "@/lib/admin-api";
import { formatRelativeTime } from "@/lib/format";
import type { Conversation } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("conversations");
  return { title: t("title") };
}

export default async function MessagesPage() {
  const t = await getTranslations("conversations");
  const conversations = await authApiGet<Conversation[]>("/conversations");

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{t("subtitle")}</p>

      {conversations.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
          <p className="text-body-md text-on-surface-variant">{t("emptyState")}</p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border-muted overflow-hidden rounded-xl border border-border-muted bg-surface-container-lowest shadow-card">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/messages/${conversation.id}`}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-container-low"
              >
                <ListingImage src={conversation.listing_image ?? undefined} alt="" sizes="64px" className="w-16 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-body-md truncate font-semibold text-on-surface">
                      {conversation.other_party.full_name}
                    </span>
                    {conversation.last_message && (
                      <span className="text-metadata shrink-0 text-on-surface-variant">
                        {formatRelativeTime(conversation.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-metadata truncate text-on-surface-variant">
                    {conversation.listing_title ?? t("listingFallback")}
                  </p>
                  <p className="text-body-md mt-0.5 truncate text-on-surface-variant">
                    {conversation.last_message?.body ?? t("noMessagesYet")}
                  </p>
                </div>
                {conversation.unread_count > 0 && (
                  <span className="text-metadata shrink-0 rounded-full bg-primary px-2 py-0.5 font-semibold text-on-primary">
                    {conversation.unread_count}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
