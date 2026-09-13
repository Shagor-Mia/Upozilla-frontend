import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ChatWindow } from "@/components/messaging/ChatWindow";
import { authApiGet } from "@/lib/admin-api";
import { listingHref } from "@/lib/format";
import { getSession } from "@/lib/session";
import type { Conversation } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("conversations");
  return { title: t("conversationTitle") };
}

async function getConversation(id: string): Promise<Conversation | null> {
  try {
    return await authApiGet<Conversation>(`/conversations/${id}`);
  } catch {
    return null;
  }
}

export default async function ConversationPage(props: PageProps<"/messages/[conversationId]">) {
  const { conversationId } = await props.params;
  const [session, conversation, t] = await Promise.all([
    getSession(),
    getConversation(conversationId),
    getTranslations("conversations"),
  ]);
  if (!session || !conversation) notFound();

  return (
    <div>
      <Link href="/messages" className="text-label-sm inline-flex items-center gap-1 text-primary hover:underline">
        <ArrowLeft size={16} />
        {t("backToMessages")}
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-headline-lg text-on-surface">{conversation.other_party.full_name}</h1>
        {conversation.listing_title && (
          <Link
            href={listingHref(conversation.listing_type, conversation.listing_id)}
            className="text-label-sm text-primary hover:underline"
          >
            {conversation.listing_title} →
          </Link>
        )}
      </div>
      <div className="mt-4">
        <ChatWindow conversationId={conversation.id} currentUserId={session.userId} />
      </div>
    </div>
  );
}
