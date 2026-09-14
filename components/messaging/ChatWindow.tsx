"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field-styles";
import { ClientApiError, clientApi } from "@/lib/client-api";
import { config } from "@/lib/config";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/api";

const PING_INTERVAL_MS = 25_000;
const POLL_INTERVAL_MS = 15_000;
const MAX_RECONNECTS = 5;

type SocketEvent = { type: "message"; message: Message } | { type: "pong" };

/**
 * Section 10 live chat: history + sends go over REST; the WebSocket (opened with
 * a single-use ticket, since the JWT is in an httpOnly cookie) is delivery only.
 * Falls back to polling whenever the socket isn't open.
 */
export function ChatWindow({ conversationId, currentUserId }: { conversationId: string; currentUserId: string }) {
  const t = useTranslations("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectsRef = useRef(0);

  const appendMessage = useCallback((message: Message) => {
    setMessages((current) => (current.some((m) => m.id === message.id) ? current : [...current, message]));
  }, []);

  const loadHistory = useCallback(
    () =>
      clientApi
        .get<Message[]>(`conversations/${conversationId}/messages`)
        .then(setMessages)
        .catch((err) => setError(err instanceof ClientApiError ? err.message : t("loadError"))),
    [conversationId, t]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    let disposed = false;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    async function connect() {
      if (disposed) return;
      try {
        const { ticket } = await clientApi.post<{ ticket: string }>("auth/ws-ticket");
        const socket = new WebSocket(`${config.wsBaseUrl}/ws?ticket=${encodeURIComponent(ticket)}`);
        socketRef.current = socket;

        socket.onopen = () => {
          reconnectsRef.current = 0;
          setLive(true);
          pingTimer = setInterval(() => socket.readyState === WebSocket.OPEN && socket.send("ping"), PING_INTERVAL_MS);
        };
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data) as SocketEvent;
          if (data.type === "message" && data.message.conversation_id === conversationId) {
            appendMessage(data.message);
          }
        };
        socket.onclose = () => {
          setLive(false);
          if (pingTimer) clearInterval(pingTimer);
          if (!disposed && reconnectsRef.current < MAX_RECONNECTS) {
            reconnectsRef.current += 1;
            setTimeout(connect, 1000 * 2 ** reconnectsRef.current);
          }
        };
        socket.onerror = () => socket.close();
      } catch {
        setLive(false);
      }
    }

    connect();
    return () => {
      disposed = true;
      if (pingTimer) clearInterval(pingTimer);
      socketRef.current?.close();
    };
  }, [conversationId, appendMessage]);

  // Poll only while the socket is down (reconnect/offline fallback, Section 10).
  useEffect(() => {
    if (live) return;
    const timer = setInterval(loadHistory, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [live, loadHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      const message = await clientApi.post<Message>(`conversations/${conversationId}/messages`, { body });
      appendMessage(message);
      setDraft("");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : t("sendError"));
    } finally {
      setSending(false);
    }
  }

  // min-h-[50vh] instead of a fixed 420px floor - see the
  // mobile-responsiveness-audit memory, finding #11 (same fix as AskChat.tsx).
  return (
    <div className="flex h-[60vh] min-h-[50vh] flex-col rounded-xl border border-border-muted bg-surface-container-lowest shadow-card">
      <div className="flex-1 space-y-2 overflow-y-auto p-4" role="log" aria-live="polite">
        {messages.length === 0 && (
          <p className="text-body-md py-8 text-center text-on-surface-variant">{t("noMessagesYet")}</p>
        )}
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-2",
                  mine ? "rounded-br-sm bg-primary text-on-primary" : "rounded-bl-sm bg-surface-container text-on-surface"
                )}
              >
                <p className="text-body-md whitespace-pre-line break-words">{message.body}</p>
                <p className={cn("text-metadata mt-1", mine ? "text-on-primary/70" : "text-on-surface-variant")}>
                  {formatRelativeTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
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
          maxLength={2000}
          placeholder={t("writeAMessage")}
          aria-label={t("messageLabel")}
          className={cn(inputClass, "max-h-32 resize-none")}
        />
        <Button type="submit" size="lg" disabled={sending || !draft.trim()} aria-label={t("send")}>
          <Send />
        </Button>
      </form>
      <div className="text-metadata flex items-center justify-between px-4 pb-2 text-on-surface-variant">
        <span>{live ? t("chatLive") : t("chatPolling")}</span>
        {error && <span className="text-error">{error}</span>}
      </div>
    </div>
  );
}
