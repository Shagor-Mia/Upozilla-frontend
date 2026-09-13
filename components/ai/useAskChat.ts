import { useState, type FormEvent } from "react";

import { ClientApiError, clientApi } from "@/lib/client-api";
import type { AiChatResponse } from "@/types/api";

export interface ChatTurn {
  question: string;
  answer: string;
}

/** Shared state/submit logic for the RAG chatbot (Section 17 Phase 4) -
 * used by both `AskChat.tsx` (full page) and `AskWidget.tsx` (floating
 * popup) so the fetch/state handling isn't duplicated between them.
 * Single-turn per question (the backend is stateless per call - works
 * whether the caller is logged in or anonymous), but keeps a running local
 * log so a conversation reads naturally. */
export function useAskChat(sendErrorMessage: string) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || pending) return;
    setDraft("");
    setPending(true);
    setError(null);
    try {
      const reply = await clientApi.post<AiChatResponse>("ai/chat", { message: question });
      setTurns((current) => [...current, { question, answer: reply.answer }]);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : sendErrorMessage);
      setDraft(question);
    } finally {
      setPending(false);
    }
  }

  return { turns, draft, setDraft, pending, error, send };
}
