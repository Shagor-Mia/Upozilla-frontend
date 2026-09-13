"use client";

import { Star } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { TrustGate } from "@/components/listings/TrustGate";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { useApiMutation } from "@/lib/use-api-mutation";

interface Session {
  userId: string;
  phoneVerified: boolean;
}

export function ReviewForm({ sellerId }: { sellerId: string }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [rating, setRating] = useState(5);
  const { run, pending: submitting, error } = useApiMutation("Could not submit the review");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data: { session: Session | null }) => setSession(data.session))
      .catch(() => setSession(null));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(
      () =>
        clientApi.post(`sellers/${sellerId}/reviews`, {
          rating,
          comment: String(formData.get("comment") ?? "").trim() || null,
        }),
      { refresh: true, onSuccess: () => setDone(true) }
    );
  }

  if (session === undefined || session?.userId === sellerId) return null;
  if (done) {
    return <p className="text-body-md text-on-surface-variant">Thanks — your review is live.</p>;
  }

  const next = `/sellers/${sellerId}`;
  const gateReason = !session ? "signin" : !session.phoneVerified ? "verify" : null;

  return (
    <TrustGate locked={gateReason !== null} reason={gateReason ?? "signin"} next={next}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              className="rounded p-0.5 transition-colors hover:text-secondary focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Star size={24} className={value <= rating ? "fill-secondary text-secondary" : "text-outline-variant"} />
            </button>
          ))}
        </div>
        <textarea
          name="comment"
          rows={3}
          maxLength={1000}
          placeholder="How was the deal? (optional)"
          className={inputClass}
        />
        {error && <p className="text-body-md text-error">{error}</p>}
        <Button type="submit" disabled={Boolean(submitting)}>
          {submitting ? "Submitting…" : "Submit review"}
        </Button>
      </form>
    </TrustGate>
  );
}
