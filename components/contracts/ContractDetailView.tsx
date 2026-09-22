"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { ImageUploader } from "@/components/common/ImageUploader";
import { StatusChip } from "@/components/listings/StatusChip";
import { Button } from "@/components/ui/button";
import { inputClass, labelClass, selectClass } from "@/components/ui/field-styles";
import { clientApi } from "@/lib/client-api";
import { config } from "@/lib/config";
import { formatDate, formatPrice, formatRelativeTime } from "@/lib/format";
import { useApiMutation } from "@/lib/use-api-mutation";
import { cn } from "@/lib/utils";
import type { Contract, ContractPayment, ContractProblem, ContractProgress } from "@/types/api";

const PING_INTERVAL_MS = 25_000;
const POLL_INTERVAL_MS = 15_000;
const MAX_RECONNECTS = 5;

type ContractSocketEvent = {
  type: "contract_update";
  event: "accepted" | "payment_logged" | "problem_reported";
  contract_id: string;
};

function ImageStrip({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {images.map((url) => (
        // eslint-disable-next-line @next/next/no-img-element -- remote pasted URLs, not a local asset
        <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg border border-border-muted object-cover" />
      ))}
    </div>
  );
}

/** Contract detail page: header + actions gated by role/status, three tabs
 * (Progress/Payments/Problems), and a ticketed WebSocket for live updates -
 * modeled on `ChatWindow.tsx`'s exact connect/reconnect/poll-fallback shape,
 * but on its own independent socket (see `contracts_repository.dart`'s
 * comment on why the Flutter app also keeps this separate from messaging). */
export function ContractDetailView({
  initialContract,
  currentUserId,
}: {
  initialContract: Contract;
  currentUserId: string;
}) {
  const t = useTranslations("contractDetail");
  const [contract, setContract] = useState(initialContract);
  const [tab, setTab] = useState<"progress" | "payments" | "problems">("progress");
  const [progress, setProgress] = useState<ContractProgress[] | null>(null);
  const [payments, setPayments] = useState<ContractPayment[] | null>(null);
  const [problems, setProblems] = useState<ContractProblem[] | null>(null);
  const [live, setLive] = useState(false);

  const refetchContract = useCallback(
    () => clientApi.get<Contract>(`contracts/${initialContract.id}`).then(setContract).catch(() => {}),
    [initialContract.id]
  );
  const refetchProgress = useCallback(
    () => clientApi.get<ContractProgress[]>(`contracts/${initialContract.id}/progress`).then(setProgress).catch(() => {}),
    [initialContract.id]
  );
  const refetchPayments = useCallback(
    () => clientApi.get<ContractPayment[]>(`contracts/${initialContract.id}/payments`).then(setPayments).catch(() => {}),
    [initialContract.id]
  );
  const refetchProblems = useCallback(
    () => clientApi.get<ContractProblem[]>(`contracts/${initialContract.id}/problems`).then(setProblems).catch(() => {}),
    [initialContract.id]
  );

  useEffect(() => {
    refetchProgress();
    refetchPayments();
    refetchProblems();
  }, [refetchProgress, refetchPayments, refetchProblems]);

  // --- live updates: ticketed WebSocket, exact pattern of ChatWindow.tsx ---
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectsRef = useRef(0);

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
          let data: ContractSocketEvent;
          try {
            data = JSON.parse(event.data);
          } catch {
            return;
          }
          if (data.type !== "contract_update" || data.contract_id !== initialContract.id) return;
          if (data.event === "accepted") refetchContract();
          if (data.event === "payment_logged") refetchPayments();
          if (data.event === "problem_reported") refetchProblems();
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
  }, [initialContract.id, refetchContract, refetchPayments, refetchProblems]);

  useEffect(() => {
    if (live) return;
    const timer = setInterval(() => {
      refetchContract();
      refetchProgress();
      refetchPayments();
      refetchProblems();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [live, refetchContract, refetchProgress, refetchPayments, refetchProblems]);

  const isEmployer = contract.employer_user_id === currentUserId;
  const isWorker = contract.worker_user_id === currentUserId;
  const isParty = isEmployer || isWorker;

  return (
    <div>
      <ContractHeader
        contract={contract}
        isEmployer={isEmployer}
        isWorker={isWorker}
        isParty={isParty}
        live={live}
        onChanged={setContract}
      />

      <div role="tablist" className="mt-6 flex flex-wrap gap-2">
        {(["progress", "payments", "problems"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "text-label-sm rounded-full border px-4 py-1.5 pointer-coarse:min-h-11 transition-colors",
              tab === value
                ? "border-primary bg-primary text-on-primary"
                : "border-border-muted bg-surface-container-lowest text-on-surface-variant hover:border-primary"
            )}
          >
            {value === "progress" ? t("tabProgress") : value === "payments" ? t("tabPayments") : t("tabProblems")}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "progress" && (
          <ProgressTab
            contract={contract}
            entries={progress}
            currentUserId={currentUserId}
            onLogged={refetchProgress}
          />
        )}
        {tab === "payments" && (
          <PaymentsTab
            contract={contract}
            payments={payments}
            currentUserId={currentUserId}
            onChanged={refetchPayments}
          />
        )}
        {tab === "problems" && (
          <ProblemsTab
            contract={contract}
            problems={problems}
            currentUserId={currentUserId}
            onProblemsChanged={refetchProblems}
            onContractChanged={refetchContract}
          />
        )}
      </div>
    </div>
  );
}

// --- Header ---------------------------------------------------------------

function statusLabel(t: (key: string) => string, status: Contract["status"]) {
  switch (status) {
    case "active":
      return t("statusActive");
    case "rejected":
      return t("statusRejected");
    case "cancelled":
      return t("statusCancelled");
    case "disputed":
      return t("statusDisputed");
    case "completed":
      return t("statusCompleted");
    default:
      return t("statusPending");
  }
}

function ContractHeader({
  contract,
  isEmployer,
  isWorker,
  isParty,
  live,
  onChanged,
}: {
  contract: Contract;
  isEmployer: boolean;
  isWorker: boolean;
  isParty: boolean;
  live: boolean;
  onChanged: (contract: Contract) => void;
}) {
  const t = useTranslations("contractDetail");
  const { run, pending: busy, error } = useApiMutation(t("errorGeneric"));
  const [rejecting, setRejecting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  async function accept() {
    await run(() => clientApi.post<Contract>(`contracts/${contract.id}/accept`), { key: "accept", onSuccess: onChanged });
  }
  async function reject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(() => clientApi.post<Contract>(`contracts/${contract.id}/reject`, { reason: reason.trim() || null }), {
      key: "reject",
      onSuccess: (updated) => {
        onChanged(updated);
        setRejecting(false);
      },
    });
  }
  async function cancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason.trim()) return;
    await run(() => clientApi.post<Contract>(`contracts/${contract.id}/cancel`, { reason: reason.trim() }), {
      key: "cancel",
      onSuccess: (updated) => {
        onChanged(updated);
        setCancelling(false);
      },
    });
  }
  async function complete() {
    await run(() => clientApi.post<Contract>(`contracts/${contract.id}/complete`), { key: "complete", onSuccess: onChanged });
  }

  const alreadyConfirmed =
    (isEmployer && contract.employer_completion_confirmed_at) || (isWorker && contract.worker_completion_confirmed_at);

  return (
    <div className="rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h1 className="text-headline-lg text-on-surface">{contract.title}</h1>
        <StatusChip status={contract.status} label={statusLabel(t, contract.status)} />
      </div>
      <p className="text-body-md mt-2 whitespace-pre-line text-on-surface-variant">{contract.description}</p>

      <dl className="text-metadata mt-4 grid grid-cols-1 gap-1 text-on-surface-variant sm:grid-cols-2">
        <div>
          <dt className="inline font-semibold">{t("employerLabel")}: </dt>
          <dd className="inline">{contract.employer_name ?? "-"}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">{t("workerLabel")}: </dt>
          <dd className="inline">{contract.worker_name ?? "-"}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">{t("paymentLabel")}: </dt>
          <dd className="inline">{formatPrice(contract.payment_amount, contract.currency)}</dd>
        </div>
        {(contract.start_date || contract.end_date) && (
          <div>
            <dt className="inline font-semibold">{t("durationLabel")}: </dt>
            <dd className="inline">
              {[contract.start_date, contract.end_date].filter(Boolean).map((d) => formatDate(d as string)).join(" - ")}
            </dd>
          </div>
        )}
        {contract.cancellation_reason && (
          <div className="sm:col-span-2">
            <dt className="inline font-semibold">{t("cancellationReasonLabel")}: </dt>
            <dd className="inline">{contract.cancellation_reason}</dd>
          </div>
        )}
      </dl>

      {contract.reference_images.length > 0 && (
        <div className="mt-3">
          <ImageStrip images={contract.reference_images} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isWorker && contract.status === "pending" && !rejecting && (
          <>
            <Button onClick={accept} disabled={busy !== false}>
              {t("accept")}
            </Button>
            <Button variant="outline" onClick={() => setRejecting(true)} disabled={busy !== false}>
              {t("reject")}
            </Button>
          </>
        )}
        {isParty && (contract.status === "pending" || contract.status === "active") && !cancelling && !rejecting && (
          <Button variant="outline" onClick={() => setCancelling(true)} disabled={busy !== false}>
            {t("cancel")}
          </Button>
        )}
        {isParty && contract.status === "active" && (
          <Button onClick={complete} disabled={busy !== false || Boolean(alreadyConfirmed)}>
            {alreadyConfirmed ? t("waitingOtherCompletion") : t("markComplete")}
          </Button>
        )}
      </div>

      {rejecting && (
        <form onSubmit={reject} className="mt-3 space-y-2 rounded-xl border border-border-muted p-4">
          <label className={labelClass}>{t("rejectReasonLabel")}</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={inputClass} />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy !== false}>
              {t("reject")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>
              {t("dismiss")}
            </Button>
          </div>
        </form>
      )}
      {cancelling && (
        <form onSubmit={cancel} className="mt-3 space-y-2 rounded-xl border border-border-muted p-4">
          <label className={labelClass}>
            {t("cancelReasonLabel")} <span className="text-error">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            required
            className={inputClass}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy !== false || !reason.trim()}>
              {t("cancel")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setCancelling(false)}>
              {t("dismiss")}
            </Button>
          </div>
        </form>
      )}

      {error && <p className="text-body-md mt-2 text-error">{error}</p>}
      {!live && <p className="text-metadata mt-2 text-on-surface-variant">{t("polling")}</p>}
    </div>
  );
}

// --- Progress tab -----------------------------------------------------------

function ProgressTab({
  contract,
  entries,
  currentUserId,
  onLogged,
}: {
  contract: Contract;
  entries: ContractProgress[] | null;
  currentUserId: string;
  onLogged: () => void;
}) {
  const t = useTranslations("contractDetail");
  const canLog =
    contract.status === "active" && (contract.employer_user_id === currentUserId || contract.worker_user_id === currentUserId);
  const [open, setOpen] = useState(false);
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const note = String(formData.get("note") ?? "").trim();
    const percentRaw = String(formData.get("percent_complete") ?? "").trim();
    const images = String(formData.get("images") ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    void run(
      () =>
        clientApi.post(`contracts/${contract.id}/progress`, {
          note,
          percent_complete: percentRaw ? Number(percentRaw) : null,
          images,
        }),
      {
        onSuccess: () => {
          setOpen(false);
          onLogged();
        },
      }
    );
  }

  return (
    <div className="space-y-3">
      {canLog && (
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {t("logProgress")}
        </Button>
      )}
      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border-muted bg-surface-container-lowest p-4">
          <div className="space-y-1.5">
            <label className={labelClass}>{t("progressNoteLabel")}</label>
            <textarea name="note" required rows={2} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>{t("progressPercentLabel")}</label>
            <input name="percent_complete" type="number" min={0} max={100} className={inputClass} />
          </div>
          <ImageUploader name="images" max={6} label={t("progressImagesLabel")} />
          {error && <p className="text-body-md text-error">{error}</p>}
          <Button type="submit" size="sm" disabled={Boolean(submitting)}>
            {t("logProgress")}
          </Button>
        </form>
      )}

      {entries === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-container" aria-hidden="true" />
      ) : entries.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">{t("progressEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border-muted overflow-hidden rounded-xl border border-border-muted bg-surface-container-lowest">
          {entries.map((entry) => (
            <li key={entry.id} className="space-y-1 p-4">
              <p className="text-body-md text-on-surface">{entry.note}</p>
              <p className="text-metadata text-on-surface-variant">
                {[entry.created_by_name, entry.percent_complete != null ? `${entry.percent_complete}%` : null, formatRelativeTime(entry.created_at)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <ImageStrip images={entry.images} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// --- Payments tab -----------------------------------------------------------

function paymentMethodLabel(t: (key: string) => string, method: ContractPayment["method"]) {
  switch (method) {
    case "bkash":
      return t("paymentMethodBkash");
    case "nagad":
      return t("paymentMethodNagad");
    case "bank":
      return t("paymentMethodBank");
    case "other":
      return t("paymentMethodOther");
    default:
      return t("paymentMethodCash");
  }
}

function PaymentsTab({
  contract,
  payments,
  currentUserId,
  onChanged,
}: {
  contract: Contract;
  payments: ContractPayment[] | null;
  currentUserId: string;
  onChanged: () => void;
}) {
  const t = useTranslations("contractDetail");
  const canLog =
    contract.status === "active" && (contract.employer_user_id === currentUserId || contract.worker_user_id === currentUserId);
  const [open, setOpen] = useState(false);
  const { run, pending: submitting, error } = useApiMutation(t("errorGeneric"));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const amount = Number(String(formData.get("amount") ?? "").trim());
    const method = String(formData.get("method") ?? "cash");
    const note = String(formData.get("note") ?? "").trim();
    const images = String(formData.get("proof_images") ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    void run(
      () => clientApi.post(`contracts/${contract.id}/payments`, { amount, method, note: note || null, proof_images: images }),
      { onSuccess: () => { setOpen(false); onChanged(); } }
    );
  }

  async function confirm(paymentId: string) {
    await run(() => clientApi.post(`contracts/${contract.id}/payments/${paymentId}/confirm`), {
      key: paymentId,
      onSuccess: onChanged,
    });
  }

  return (
    <div className="space-y-3">
      {canLog && (
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {t("logPayment")}
        </Button>
      )}
      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border-muted bg-surface-container-lowest p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className={labelClass}>{t("paymentAmountLabel")}</label>
              <input name="amount" type="number" min={0.01} step="0.01" required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>{t("paymentMethodLabel")}</label>
              <select name="method" defaultValue="cash" className={selectClass}>
                <option value="cash">{t("paymentMethodCash")}</option>
                <option value="bkash">{t("paymentMethodBkash")}</option>
                <option value="nagad">{t("paymentMethodNagad")}</option>
                <option value="bank">{t("paymentMethodBank")}</option>
                <option value="other">{t("paymentMethodOther")}</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>{t("paymentNoteLabel")}</label>
            <textarea name="note" rows={2} className={inputClass} />
          </div>
          <ImageUploader name="proof_images" max={4} label={t("paymentProofImagesLabel")} />
          {error && <p className="text-body-md text-error">{error}</p>}
          <Button type="submit" size="sm" disabled={Boolean(submitting)}>
            {t("logPayment")}
          </Button>
        </form>
      )}

      {payments === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-container" aria-hidden="true" />
      ) : payments.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">{t("paymentsEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border-muted overflow-hidden rounded-xl border border-border-muted bg-surface-container-lowest">
          {payments.map((payment) => {
            const canConfirm = payment.status === "pending_confirmation" && payment.logged_by_user_id !== currentUserId;
            return (
              <li key={payment.id} className="space-y-1 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-body-md font-semibold text-on-surface">
                    {formatPrice(payment.amount, contract.currency)}
                  </p>
                  {canConfirm && (
                    <Button size="sm" variant="outline" onClick={() => confirm(payment.id)}>
                      {t("confirmPayment")}
                    </Button>
                  )}
                </div>
                <p className="text-metadata text-on-surface-variant">
                  {[
                    paymentMethodLabel(t, payment.method),
                    payment.status === "confirmed" ? t("paymentStatusConfirmed") : t("paymentStatusPendingConfirmation"),
                    payment.note,
                    formatRelativeTime(payment.paid_at),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <ImageStrip images={payment.proof_images} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// --- Problems tab -----------------------------------------------------------

function problemCategoryLabel(t: (key: string) => string, category: ContractProblem["category"]) {
  switch (category) {
    case "payment_issue":
      return t("problemCategoryPaymentIssue");
    case "quality_issue":
      return t("problemCategoryQualityIssue");
    case "no_show":
      return t("problemCategoryNoShow");
    case "other":
      return t("problemCategoryOther");
    default:
      return t("problemCategoryScopeDisagreement");
  }
}

function problemStatusLabel(t: (key: string) => string, status: ContractProblem["status"]) {
  switch (status) {
    case "resolved":
      return t("problemStatusResolved");
    case "escalated":
      return t("problemStatusEscalated");
    case "dispute_resolved":
      return t("problemStatusDisputeResolved");
    default:
      return t("problemStatusOpen");
  }
}

function resolutionLabel(t: (key: string) => string, resolution: ContractProblem["resolution"]) {
  switch (resolution) {
    case "favor_employer":
      return t("disputeFavorEmployer");
    case "favor_worker":
      return t("disputeFavorWorker");
    case "dismissed":
      return t("disputeDismissed");
    default:
      return null;
  }
}

function ProblemsTab({
  contract,
  problems,
  currentUserId,
  onProblemsChanged,
  onContractChanged,
}: {
  contract: Contract;
  problems: ContractProblem[] | null;
  currentUserId: string;
  onProblemsChanged: () => void;
  onContractChanged: () => void;
}) {
  const t = useTranslations("contractDetail");
  const canReport =
    contract.status === "active" && (contract.employer_user_id === currentUserId || contract.worker_user_id === currentUserId);
  const [open, setOpen] = useState(false);
  const [escalating, setEscalating] = useState<string | null>(null);
  const { run, pending: busy, error } = useApiMutation(t("errorGeneric"));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const category = String(formData.get("category") ?? "scope_disagreement");
    const description = String(formData.get("description") ?? "").trim();
    const images = String(formData.get("images") ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    void run(() => clientApi.post(`contracts/${contract.id}/problems`, { category, description, images }), {
      onSuccess: () => {
        setOpen(false);
        onProblemsChanged();
      },
    });
  }

  async function resolve(problemId: string) {
    await run(() => clientApi.post(`contracts/${contract.id}/problems/${problemId}/resolve`), {
      key: `resolve-${problemId}`,
      onSuccess: onProblemsChanged,
    });
  }

  async function escalate(problemId: string) {
    await run(() => clientApi.post(`contracts/${contract.id}/problems/${problemId}/escalate`), {
      key: `escalate-${problemId}`,
      onSuccess: () => {
        setEscalating(null);
        onProblemsChanged();
        onContractChanged();
      },
    });
  }

  return (
    <div className="space-y-3">
      {canReport && (
        <Button size="sm" onClick={() => setOpen((v) => !v)}>
          {t("reportProblem")}
        </Button>
      )}
      {open && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border-muted bg-surface-container-lowest p-4">
          <div className="space-y-1.5">
            <label className={labelClass}>{t("problemCategoryLabel")}</label>
            <select name="category" defaultValue="scope_disagreement" className={selectClass}>
              <option value="scope_disagreement">{t("problemCategoryScopeDisagreement")}</option>
              <option value="payment_issue">{t("problemCategoryPaymentIssue")}</option>
              <option value="quality_issue">{t("problemCategoryQualityIssue")}</option>
              <option value="no_show">{t("problemCategoryNoShow")}</option>
              <option value="other">{t("problemCategoryOther")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>{t("problemDescriptionLabel")}</label>
            <textarea name="description" required rows={2} className={inputClass} />
          </div>
          <ImageUploader name="images" max={6} label={t("problemImagesLabel")} />
          {error && <p className="text-body-md text-error">{error}</p>}
          <Button type="submit" size="sm" disabled={busy !== false}>
            {t("reportProblem")}
          </Button>
        </form>
      )}

      {problems === null ? (
        <div className="h-24 animate-pulse rounded-xl bg-surface-container" aria-hidden="true" />
      ) : problems.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">{t("problemsEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border-muted overflow-hidden rounded-xl border border-border-muted bg-surface-container-lowest">
          {problems.map((problem) => {
            const isOpen = problem.status === "open";
            const resolution = resolutionLabel(t, problem.resolution);
            return (
              <li key={problem.id} className="space-y-1 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-body-md font-semibold text-on-surface">{problemCategoryLabel(t, problem.category)}</p>
                  <StatusChip status={problem.status} label={problemStatusLabel(t, problem.status)} />
                </div>
                <p className="text-body-md text-on-surface-variant">{problem.description}</p>
                {resolution && <p className="text-metadata text-on-surface-variant">{resolution}</p>}
                {problem.resolution_note && (
                  <p className="text-metadata text-on-surface-variant">
                    {t("resolutionNoteLabel")}: {problem.resolution_note}
                  </p>
                )}
                <ImageStrip images={problem.images} />
                {isOpen && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => resolve(problem.id)} disabled={busy !== false}>
                      {t("resolveProblem")}
                    </Button>
                    {escalating === problem.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-metadata text-on-surface-variant">{t("escalateConfirmBody")}</span>
                        <Button size="sm" onClick={() => escalate(problem.id)} disabled={busy !== false}>
                          {t("escalateProblem")}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEscalating(null)}>
                          {t("dismiss")}
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setEscalating(problem.id)}>
                        {t("escalateProblem")}
                      </Button>
                    )}
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
