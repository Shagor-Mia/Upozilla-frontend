"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { ClientApiError } from "@/lib/client-api";

interface RunOptions<T> {
  /** Distinguishes concurrent actions sharing one hook instance, e.g. a
   * per-row "busy" id in a list. Omit for a single boolean `pending`. */
  key?: string;
  /** Refresh the current route's server data on success. Off by default. */
  refresh?: boolean;
  /** Overrides the hook's default fallback message for this call only. */
  fallbackError?: string;
  onSuccess?: (result: T) => void | Promise<void>;
  /** Return true to signal the error was already handled (e.g. a redirect)
   * so the hook shouldn't also set its own error message. */
  onError?: (error: unknown) => boolean | void;
}

/** Centralizes the pending/error/refresh boilerplate every clientApi-backed
 * form, toggle, or row action in the admin/account/listing UI repeats. */
export function useApiMutation(fallbackError: string) {
  const router = useRouter();
  const [pending, setPending] = useState<string | boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(action: () => Promise<T>, options?: RunOptions<T>): Promise<T | undefined> => {
      setPending(options?.key ?? true);
      setError(null);
      try {
        const result = await action();
        if (options?.refresh) router.refresh();
        await options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const handled = options?.onError?.(err);
        if (!handled) setError(err instanceof ClientApiError ? err.message : (options?.fallbackError ?? fallbackError));
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [router, fallbackError]
  );

  return { run, pending, error, setError };
}
