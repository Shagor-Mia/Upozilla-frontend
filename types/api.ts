// Thin alias layer over the OpenAPI-generated schema (types/generated.ts, regenerated via
// `npm run types:generate` from the backend's live schema). Every name below is exported so
// existing `import { X } from "@/types/api"` call sites across the app keep working unchanged;
// the actual shapes now come straight from the backend Pydantic models, so a field the backend
// renames or removes fails `tsc`/`next build` instead of silently drifting at runtime.
//
// A handful of types have no backend-exposed literal equivalent (the response field is a plain
// `string`, not a Pydantic Enum) and stay hand-written below - they're frontend-only narrowing
// aids, not duplicated response shapes.

import type { components } from "./generated";

type Schemas = components["schemas"];

export type LocationType = Schemas["LocationType"];
export type Location = Schemas["LocationResponse"];

// `distance_km` is optional in the generated schema only because the backend field has a
// `None` default (Section 17 Phase 3, geo.py) - it's always present in the actual response
// (null when no lat/lng was given), so it's restored to required here like the other fields.
type WithDistance<T> = Omit<T, "distance_km"> & { distance_km: number | null };

export type PlaceCategory = Schemas["PlaceCategory"];
export type Place = WithDistance<Schemas["PlaceResponse"]>;

export type ServiceCategory = Schemas["ServiceCategoryResponse"];
export type Service = Schemas["ServiceResponse"];

export type HospitalType = Schemas["HospitalType"];
export type Hospital = WithDistance<Schemas["HospitalResponse"]>;
export type Doctor = Schemas["DoctorResponse"];
export type AmbulanceHospital = Schemas["AmbulanceHospitalResponse"];
export type HospitalAdmin = Schemas["HospitalAdminResponse"];

export type SchoolType = Schemas["SchoolType"];
export type School = WithDistance<Schemas["SchoolResponse"]>;
export type SchoolAdmin = Schemas["SchoolAdminResponse"];

export type MarketType = Schemas["MarketType"];
export type Market = WithDistance<Schemas["MarketResponse"]>;

export type Business = WithDistance<Schemas["BusinessResponse"]>;

export type GovtOfficeCategory = Schemas["GovtOfficeCategory"];
export type GovtOffice = Schemas["GovtOfficeResponse"];

export type NewsArticle = Schemas["NewsArticleResponse"];
export type NewsArticleDetail = Schemas["NewsArticleDetailResponse"];
export type NewsSource = Schemas["NewsSourceResponse"];

// --- Auth / RBAC (Section 5.12) -------------------------------------------------

export type Role = Schemas["Role"];

// The backend never returns a typed list of permission strings (RoleDefinition.permissions
// is a plain string[]) - this stays hand-written as the frontend's own exhaustive gate list.
export type Permission =
  | "dashboard.view"
  | "content.manage"
  | "news.manage"
  | "marketplace.moderate"
  | "business.verify"
  | "users.manage"
  | "roles.manage"
  | "support.view"
  | "settings.manage";

// `role` comes back as a plain `string` from these three endpoints (the backend schema
// doesn't reuse the `Role` enum there) - narrowed back since every value is in fact a Role.
export type CurrentUser = Omit<Schemas["UserResponse"], "role" | "oauth_provider"> & {
  role: Role;
  oauth_provider: string | null;
};
export type OtpPurpose = Schemas["OtpPurpose"];
// `dev_code` is optional in the schema only because of its `None` default (dev-mode OTP echo,
// Section 10) - always present in the actual response.
export type OtpRequestResponse = Omit<Schemas["OtpRequestResponse"], "dev_code"> & {
  dev_code: string | null;
};
export type ScopedRole = Omit<Schemas["ScopedRoleResponse"], "role"> & { role: Role };
export type AdminUser = Omit<Schemas["AdminUserResponse"], "role" | "scoped_roles"> & {
  role: Role;
  scoped_roles: ScopedRole[];
};
export type RoleDefinition = Schemas["RoleDefinition"];

// `meta` comes back as `Record<string, never>` from the generic dict[str, Any] schema -
// widen it back to something usable, same as the rest of this file's fields otherwise would be.
export type AuditLogEntry = Omit<Schemas["AuditLogResponse"], "meta"> & {
  meta: Record<string, unknown>;
};

export type DashboardCounts = Schemas["DashboardCounts"];

// --- Marketplace & Exchange (Sections 5.7 / 5.8) --------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export type ListingType = Schemas["ListingType"];
export type ItemCondition = Schemas["ItemCondition"];
export type ListingSort = Schemas["ListingSort"];

// The backend's moderation_status fields are plain strings (not a shared Enum schema) -
// this stays hand-written for call sites that need to narrow/compare against known values.
export type ModerationStatus = "pending" | "approved" | "rejected";

export type MarketplaceCategory = Schemas["CategoryResponse"];
export type SellerSummary = Schemas["SellerSummary"];

export type ExchangeListingStatus = Schemas["ListingStatus"];
// `listing_type` is typed as the full `ListingType` union on both response schemas (the
// backend's shared enum, not narrowed per-schema) - re-narrowed to a literal here so
// `Listing` stays a discriminated union, matching how every consumer switches on it.
export type ExchangeListing = Omit<Schemas["ExchangeListingResponse"], "listing_type"> & {
  listing_type: "exchange";
};

export type ProductStatus = Schemas["ProductStatus"];
export type MarketplaceProduct = Omit<Schemas["ProductResponse"], "listing_type"> & {
  listing_type: "marketplace";
};

export type Listing = ExchangeListing | MarketplaceProduct;

// Rebuilt against the narrowed Exchange/MarketplaceProduct aliases above (not the raw
// generated schema) so arrays built from `exchange`/`marketplace` satisfy `Listing[]`.
export interface FavoritesResponse {
  exchange: ExchangeListing[];
  marketplace: MarketplaceProduct[];
}

export type ReportReason = Schemas["ReportReason"];

export type SellerReview = Schemas["SellerReviewResponse"];
export type SellerProfile = Schemas["SellerProfileResponse"];
export type ContactReveal = Schemas["ContactRevealResponse"];

// --- Messaging (Section 5.8) -----------------------------------------------------

export type Message = Schemas["MessageResponse"];
export type ConversationParticipant = Schemas["ConversationParticipant"];
export type Conversation = Schemas["ConversationResponse"];

// --- Moderation (Section 5.9) ----------------------------------------------------

export type ModerationEntityType = Schemas["ModerationEntityType"];
export type ModerationQueueStatus = Schemas["ModerationQueueStatus"];
// `listing_type` on both snapshots is a plain string on the backend - narrowed back here.
// QueueListingSnapshot also covers shops and places (moderation/service.py's
// `_listing_snapshot_from`), neither of which participates in the report flow, so
// QueueReportSnapshot stays exchange/marketplace only.
export type QueueListingSnapshot = Omit<Schemas["QueueListingSnapshot"], "listing_type"> & {
  listing_type: ListingType | "shop" | "place";
};
export type QueueReportSnapshot = Omit<Schemas["QueueReportSnapshot"], "listing_type"> & {
  listing_type: ListingType;
};
export type QueueContractSnapshot = Schemas["QueueContractSnapshot"];
export type ModerationQueueItem = Omit<Schemas["ModerationQueueItem"], "listing" | "report" | "contract"> & {
  listing: QueueListingSnapshot | null;
  report: QueueReportSnapshot | null;
  contract: QueueContractSnapshot | null;
};
export type ModerationStats = Schemas["ModerationStats"];
// `favored_party` is required alongside `decision: "approve"` only for a CONTRACT_DISPUTE
// queue item (backend/app/modules/moderation/schemas.py::ModerationReviewBody) - already
// optional on the generated schema, aliased here just for a shorter import path.
export type ModerationReviewBody = Schemas["ModerationReviewBody"];

// --- Platform settings (admin-editable integrations) -----------------------------

export type PublicSettings = Schemas["PublicSettings"];

// --- AI layer (Section 5.13 / 17 Phase 4) ----------------------------------------

export type AiChatSource = Schemas["SourceRef"];
export type AiChatResponse = Schemas["ChatResponse"];

export type Faq = Schemas["FaqResponse"];

// AiSettingsResponse.tier is a plain string on the backend - stays hand-written so
// the admin AI settings form can keep exhaustive-checking against known tiers.
export type AiTier = "economy" | "standard" | "premium";

export type AiSettings = Omit<Schemas["AiSettingsResponse"], "tier"> & { tier: AiTier };
export type TestConnectionResult = Schemas["TestConnectionResponse"];

// Rebuilt against this file's narrowed aliases (distance_km, discriminated listing_type)
// rather than the raw generated schema, for the same reason as FavoritesResponse above.
// --- Shops (standalone or inside a Market) ------------------------------------------

export type ShopCategory = Schemas["ShopCategoryResponse"];
export type Shop = Schemas["ShopResponse"];

// --- Union representative directory -------------------------------------------------

export type RepresentativePosition = Schemas["RepresentativePosition"];
export type RepresentativeStatus = Schemas["RepresentativeStatus"];
export type Representative = Schemas["RepresentativeResponse"];

export type RecommendationsResponse = Omit<
  Schemas["RecommendationsResponse"],
  "trending_products" | "trending_exchange" | "places" | "hospitals" | "markets" | "services" | "news"
> & {
  trending_products: MarketplaceProduct[];
  trending_exchange: ExchangeListing[];
  places: Place[];
  hospitals: Hospital[];
  markets: Market[];
  services: Service[];
  news: NewsArticle[];
};

export type AdminSettingItem = Schemas["AdminSettingItem"];

// --- Work Contracts (চুক্তিপত্র) --------------------------------------------------

// `status`/`payment_type`/`method`/`category`/`resolution` are plain strings on the
// backend's response schemas (only the *Create* payloads use the real enum) - narrowed
// back here the same way ModerationStatus/AiTier are above, so callers can exhaustively
// switch on them.
export type ContractStatus = Schemas["ContractStatus"];
export type ContractPaymentType = Schemas["ContractPaymentType"];
export type ContractPaymentMethod = Schemas["ContractPaymentMethod"];
export type ContractProblemCategory = Schemas["ContractProblemCategory"];
export type ContractProblemStatus = "open" | "resolved" | "escalated" | "dispute_resolved";
export type ContractDisputeResolution = "favor_employer" | "favor_worker" | "dismissed";

export type Contract = Omit<Schemas["ContractResponse"], "status" | "payment_type"> & {
  status: ContractStatus;
  payment_type: ContractPaymentType;
};
export type ContractCreate = Schemas["ContractCreate"];

export type ContractProgress = Schemas["ContractProgressResponse"];
export type ContractProgressCreate = Schemas["ContractProgressCreate"];

export type ContractPayment = Omit<Schemas["ContractPaymentResponse"], "method" | "status"> & {
  method: ContractPaymentMethod;
  status: "pending_confirmation" | "confirmed";
};
export type ContractPaymentCreate = Schemas["ContractPaymentCreate"];

export type ContractProblem = Omit<Schemas["ContractProblemResponse"], "category" | "status" | "resolution"> & {
  category: ContractProblemCategory;
  status: ContractProblemStatus;
  resolution: ContractDisputeResolution | null;
};
export type ContractProblemCreate = Schemas["ContractProblemCreate"];

export type UserLookup = Schemas["UserLookupResponse"];
