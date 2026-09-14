"use client";

import { Send, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field-styles";
import { cn } from "@/lib/utils";
import { useAskChat } from "@/components/ai/useAskChat";

/** Section 17 Phase 4 RAG chatbot, full-page view. Mirrors ChatWindow.tsx's
 * bubble/input conventions rather than inventing a new visual style. See
 * `AskWidget.tsx` for the floating-popup counterpart - both share
 * `useAskChat` for the fetch/state logic. */
export function AskChat() {
  const t = useTranslations("aiChat");
  const { turns, draft, setDraft, pending, error, send } = useAskChat(t("sendError"));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [turns.length, pending]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="text-primary" size={22} />
        <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
      </div>
      <p className="text-body-md mb-6 text-on-surface-variant">{t("subtitle")}</p>

      {/* min-h-[50vh] instead of a fixed 420px floor - that floor was taller
          than 60vh on any phone under ~700px tall, forcing extra scroll to
          reach the input on first load (see the mobile-responsiveness-audit
          memory, finding #11). */}
      <div className="flex h-[60vh] min-h-[50vh] flex-col rounded-xl border border-border-muted bg-surface-container-lowest shadow-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4" role="log" aria-live="polite">
          {turns.length === 0 && !pending && (
            <p className="text-body-md py-8 text-center text-on-surface-variant">{t("emptyState")}</p>
          )}
          {turns.map((turn, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-on-primary">
                  <p className="text-body-md whitespace-pre-line break-words">{turn.question}</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-surface-container px-4 py-2 text-on-surface">
                  <p className="text-body-md whitespace-pre-line break-words">{turn.answer}</p>
                </div>
              </div>
            </div>
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-surface-container px-4 py-2 text-on-surface-variant">
                <p className="text-body-md">{t("thinking")}</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex items-end gap-2 border-t border-border-muted p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder={t("placeholder")}
            aria-label={t("title")}
            className={cn(inputClass, "max-h-32 resize-none")}
          />
          <Button type="submit" size="lg" disabled={pending || !draft.trim()} aria-label={t("send")}>
            <Send />
          </Button>
        </form>
        {error && <div className="text-metadata px-4 pb-2 text-error">{error}</div>}
      </div>

      <p className="text-metadata mt-3 text-on-surface-variant">{t("disclaimer")}</p>
    </div>
  );
}
