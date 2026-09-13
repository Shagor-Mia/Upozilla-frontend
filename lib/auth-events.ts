const AUTH_CHANGED_EVENT = "auth-changed";

/** AuthNav fetches its session once on mount; since it lives in the persistent
 * root layout, App Router client-side navigation never remounts it. Call this
 * after login/register/logout so it knows to refetch. */
export function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function onAuthChanged(callback: () => void) {
  window.addEventListener(AUTH_CHANGED_EVENT, callback);
  return () => window.removeEventListener(AUTH_CHANGED_EVENT, callback);
}
