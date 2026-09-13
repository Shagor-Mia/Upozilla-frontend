"use client";

import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field-styles";
import { useAskChat } from "@/components/ai/useAskChat";
import { cn } from "@/lib/utils";

/** Section 17 Phase 4 RAG chatbot, floating-widget view (mirrors a reference
 * storefront's bottom-right chat bubble) - works for anonymous visitors too
 * (backend Section 23 follow-up: `/ai/chat` no longer requires login).
 * Mounted once, globally, in `app/layout.tsx`. See `AskChat.tsx` for the
 * full-page counterpart - both share `useAskChat` for the fetch/state logic. */
export function AskWidget() {
  const t = useTranslations("aiChat");
  const [open, setOpen] = useState(false);
  const { turns, draft, setDraft, pending, error, send } = useAskChat(t("sendError"));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [open, turns.length, pending]);

  return (
    <div className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[70vh] max-h-[520px] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-border-muted bg-surface-container-lowest shadow-lg">
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-3 text-on-primary">
            <span className="flex items-center gap-2">
              <Sparkles size={18} />
              <span className="text-body-md font-semibold">{t("title")}</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("closeWidget")}
              className="rounded-full p-1 hover:bg-on-primary/10"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3" role="log" aria-live="polite">
            {turns.length === 0 && !pending && (
              <p className="text-body-md py-6 text-center text-on-surface-variant">{t("emptyState")}</p>
            )}
            {turns.map((turn, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-1.5 text-on-primary">
                    <p className="text-metadata whitespace-pre-line break-words">{turn.question}</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-container px-3 py-1.5 text-on-surface">
                    <p className="text-metadata whitespace-pre-line break-words">{turn.answer}</p>
                  </div>
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-container px-3 py-1.5 text-on-surface-variant">
                  <p className="text-metadata">{t("thinking")}</p>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex items-end gap-2 border-t border-border-muted p-2">
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
              className={cn(inputClass, "max-h-24 resize-none text-sm")}
            />
            <Button type="submit" size="icon-sm" disabled={pending || !draft.trim()} aria-label={t("send")}>
              <Send size={16} />
            </Button>
          </form>
          {error && <div className="text-metadata px-3 pb-2 text-error">{error}</div>}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("closeWidget") : t("openWidget")}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
