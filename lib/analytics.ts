/**
 * Marketing/conversion events (Section 16.1). Everything goes through the GTM
 * dataLayer - GA4 and Meta Pixel are configured *inside* the GTM container,
 * never as separate script tags here. Suggested tag mapping in GTM:
 *
 *   dataLayer event        GA4 event              Meta Pixel event
 *   ---------------------  ---------------------  -------------------------------
 *   place_view             place_view             ViewContent
 *   listing_view           listing_view           ViewContent (content_type=listing)
 *   listing_contact_click  listing_contact_click  Contact
 *   otp_verified           otp_verified           Lead
 *   listing_created        listing_created        custom conversion "ListingCreated"
 *   signup                 sign_up                CompleteRegistration
 *   near_me_used           near_me_used           custom event "NearMeUsed" (no conversion)
 *
 * Nothing fires until the visitor accepts the consent banner (GTM isn't
 * mounted before that), so this is safe to call unconditionally.
 */

export type AnalyticsEvent =
  | { event: "place_view"; place_id: string; place_slug: string }
  | {
      event: "listing_view";
      listing_type: "exchange" | "marketplace";
      listing_id: string;
      category: string;
      value: number;
      currency: string;
    }
  | { event: "listing_contact_click"; listing_type: "exchange" | "marketplace"; listing_id: string }
  | { event: "otp_verified"; purpose: "login" | "register" | "verify_phone" }
  | { event: "listing_created"; listing_type: "exchange" | "marketplace"; category: string; value: number }
  | { event: "signup"; method: "password" | "otp" | "facebook" | "google" }
  | {
      event: "near_me_used";
      entity: "hospitals" | "schools" | "markets" | "places" | "businesses";
      radius_km: number;
    };

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function trackEvent(payload: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}
