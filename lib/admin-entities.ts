import "server-only";

import { apiGet } from "@/lib/api-client";
import { getCategories } from "@/lib/listings";
import { getLocationOptions } from "@/lib/locations";
import type { Market, NewsSource, Paginated, ServiceCategory, ShopCategory } from "@/types/api";

export interface EntityField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "datetime-local";
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Static options for a select field. */
  options?: { value: string; label: string }[];
  /** Resolved server-side and merged into `options` before the form renders. */
  optionsSource?: "locations" | "serviceCategories" | "newsSources" | "marketplaceCategories" | "markets" | "shopCategories";
  /** Comma-separated input, submitted to the backend as a string[]. */
  isCommaList?: boolean;
  /**
   * Renders one input per language (bn/en/ar) instead of one plain input,
   * submitted as `${name}_bn`/`${name}_en`/`${name}_ar` (Section 5: content
   * localization). Only `text`/`textarea` fields support this.
   */
  localized?: boolean;
}

export interface EntityColumn {
  /** Dotted paths (`seller.full_name`) read nested response fields. */
  key: string;
  label: string;
}

export interface EntityConfig {
  key: string;
  label: string;
  description: string;
  /** Backend create path, relative to NEXT_PUBLIC_API_BASE_URL. */
  apiPath: string;
  /** Backend list path when it differs from `apiPath` (e.g. an admin "all statuses" view). */
  listPath?: string;
  /** List endpoint needs the admin's token (not a public, cacheable read). */
  requiresAuth?: boolean;
  /** List endpoint returns `Paginated<T>` (`{items, total, page, page_size}`) instead of a plain array. */
  paginated?: boolean;
  /**
   * Entity supports `GET {apiPath}/admin/{id}` (raw per-language fields) and
   * `PATCH {apiPath}/{id}` (Section 22.2 — lets an admin hand-correct a
   * translation after creation). Adds an "Edit" link per row.
   */
  supportsEdit?: boolean;
  /** Optional companion admin screen shown next to "Add new" (e.g. the business verification view). */
  related?: { href: string; label: string };
  fields: EntityField[];
  columns: EntityColumn[];
}

const LISTING_FIELDS: EntityField[] = [
  { name: "category_id", label: "Category", type: "select", required: true, optionsSource: "marketplaceCategories" },
  { name: "location_id", label: "Location", type: "select", required: true, optionsSource: "locations" },
  { name: "title", label: "Title", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "price", label: "Price (BDT)", type: "number", required: true },
  {
    name: "condition",
    label: "Condition",
    type: "select",
    required: true,
    options: [
      { value: "new", label: "New" },
      { value: "used", label: "Used" },
    ],
  },
  { name: "images", label: "Photo URLs", type: "text", isCommaList: true, help: "Comma-separated https URLs" },
  { name: "latitude", label: "Latitude", type: "number" },
  { name: "longitude", label: "Longitude", type: "number" },
];

const LISTING_COLUMNS: EntityColumn[] = [
  { key: "title", label: "Title" },
  { key: "category_name", label: "Category" },
  { key: "price", label: "Price" },
  { key: "seller.full_name", label: "Seller" },
  { key: "status", label: "Status" },
  { key: "moderation_status", label: "Moderation" },
];

export const ADMIN_ENTITIES: Record<string, EntityConfig> = {
  places: {
    key: "places",
    label: "Places",
    description: "Tourist spots, parks, and notable places.",
    apiPath: "/places",
    supportsEdit: true,
    paginated: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "location_id", label: "Location", type: "select", required: true, optionsSource: "locations" },
      { name: "name", label: "Name", type: "text", required: true, localized: true },
      { name: "slug", label: "Slug", type: "text", required: true, help: "URL-friendly, e.g. dhaka-park" },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: [
          { value: "tourist", label: "Tourist" },
          { value: "park", label: "Park" },
          { value: "historical", label: "Historical" },
          { value: "religious", label: "Religious" },
          { value: "natural", label: "Natural" },
          { value: "shop", label: "Shop" },
          { value: "other", label: "Other" },
        ],
      },
      { name: "description", label: "Description", type: "textarea", localized: true },
      { name: "cover_image", label: "Cover image URL", type: "text" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
      { name: "is_featured", label: "Feature on homepage", type: "checkbox" },
    ],
  },
  services: {
    key: "services",
    label: "Services",
    description: "Government and union/village-level service information.",
    apiPath: "/services",
    supportsEdit: true,
    paginated: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "office_name", label: "Office" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "location_id", label: "Location", type: "select", required: true, optionsSource: "locations" },
      {
        name: "category_id",
        label: "Category",
        type: "select",
        required: true,
        optionsSource: "serviceCategories",
      },
      { name: "name", label: "Name", type: "text", required: true, localized: true },
      { name: "description", label: "Description", type: "textarea", localized: true },
      { name: "eligibility", label: "Eligibility", type: "textarea" },
      { name: "required_documents", label: "Required documents", type: "text", isCommaList: true, help: "Comma-separated" },
      { name: "fee", label: "Fee (BDT)", type: "number" },
      { name: "official_link", label: "Official link", type: "text" },
      { name: "office_name", label: "Office name", type: "text", localized: true },
      { name: "office_contact", label: "Office contact", type: "text" },
    ],
  },
  hospitals: {
    key: "hospitals",
    label: "Hospitals",
    description: "Government, private, and clinic listings.",
    apiPath: "/hospitals",
    supportsEdit: true,
    paginated: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "address", label: "Address" },
    ],
    fields: [
      { name: "location_id", label: "Location", type: "select", required: true, optionsSource: "locations" },
      { name: "name", label: "Name", type: "text", required: true, localized: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "govt", label: "Government" },
          { value: "private", label: "Private" },
          { value: "clinic", label: "Clinic" },
        ],
      },
      { name: "address", label: "Address", type: "text" },
      { name: "contact", label: "Contact", type: "text" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
    ],
  },
  schools: {
    key: "schools",
    label: "Schools",
    description: "Government, private, madrasa, and college listings.",
    apiPath: "/schools",
    supportsEdit: true,
    paginated: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "address", label: "Address" },
    ],
    fields: [
      { name: "location_id", label: "Location", type: "select", required: true, optionsSource: "locations" },
      { name: "name", label: "Name", type: "text", required: true, localized: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "govt", label: "Government" },
          { value: "private", label: "Private" },
          { value: "madrasa", label: "Madrasa" },
          { value: "college", label: "College" },
          { value: "other", label: "Other" },
        ],
      },
      { name: "address", label: "Address", type: "text" },
      { name: "contact", label: "Contact", type: "text" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
    ],
  },
  markets: {
    key: "markets",
    label: "Markets",
    description: "Weekly bazaar / haat schedule and locations.",
    apiPath: "/markets",
    supportsEdit: true,
    paginated: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
    ],
    fields: [
      { name: "location_id", label: "Location", type: "select", required: true, optionsSource: "locations" },
      { name: "name", label: "Name", type: "text", required: true, localized: true },
      {
        name: "description",
        label: "Highlights",
        type: "textarea",
        localized: true,
        help: "What's generally available here - e.g. fish wholesale, produce, specific vendors worth knowing about.",
      },
      {
        name: "market_day",
        label: "Market days",
        type: "text",
        isCommaList: true,
        help: "Comma-separated, e.g. Friday, Monday",
      },
      { name: "start_time", label: "Start time", type: "text", placeholder: "08:00" },
      { name: "end_time", label: "End time", type: "text", placeholder: "18:00" },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { value: "general", label: "General" },
          { value: "cattle", label: "Cattle" },
          { value: "fish", label: "Fish" },
          { value: "vegetable", label: "Vegetable" },
        ],
      },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
    ],
  },
  "govt-offices": {
    key: "govt-offices",
    label: "Government offices",
    description: "UNO office / Upazila Parishad / Union Parishad / police station contact directory.",
    apiPath: "/govt-offices",
    supportsEdit: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "phone", label: "Phone" },
    ],
    fields: [
      { name: "location_id", label: "Location", type: "select", required: true, optionsSource: "locations" },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: [
          { value: "uno_office", label: "UNO Office" },
          { value: "upazila_parishad", label: "Upazila Parishad" },
          { value: "union_parishad", label: "Union Parishad" },
          { value: "police_station", label: "Police Station" },
          { value: "other", label: "Other" },
        ],
      },
      { name: "name", label: "Name", type: "text", required: true, localized: true },
      { name: "address", label: "Address", type: "text" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
      { name: "sort_order", label: "Sort order", type: "number" },
    ],
  },
  business: {
    key: "business",
    label: "Businesses",
    description: "Local business directory.",
    apiPath: "/businesses",
    supportsEdit: true,
    related: { href: "/admin/businesses", label: "Verify businesses" },
    columns: [
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "location_id", label: "Location", type: "select", required: true, optionsSource: "locations" },
      { name: "name", label: "Name", type: "text", required: true, localized: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "category", label: "Category", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea", localized: true },
      { name: "phone", label: "Phone (emergency contact)", type: "text" },
      { name: "address", label: "Address", type: "text" },
      { name: "latitude", label: "Latitude", type: "number" },
      { name: "longitude", label: "Longitude", type: "number" },
      { name: "images", label: "Photo URLs", type: "text", isCommaList: true, help: "Comma-separated https URLs, up to 3" },
    ],
  },
  news: {
    key: "news",
    label: "News",
    description: "Local, national, and international news.",
    apiPath: "/news",
    listPath: "/news/all",
    requiresAuth: true,
    columns: [
      { key: "title", label: "Title" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "source_id", label: "Source", type: "select", required: true, optionsSource: "newsSources" },
      { name: "location_id", label: "Location", type: "select", optionsSource: "locations" },
      { name: "category", label: "Category", type: "text" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "summary", label: "Summary", type: "textarea" },
      { name: "body", label: "Body", type: "textarea" },
      { name: "original_url", label: "Original URL", type: "text" },
      { name: "image", label: "Image URL", type: "text" },
      {
        name: "tags",
        label: "Tags",
        type: "text",
        isCommaList: true,
        help: "Comma-separated. Left blank, the AI chatbot's summarizer fills these in if an OpenAI key is configured.",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
        ],
      },
    ],
  },
  marketplace: {
    key: "marketplace",
    label: "Marketplace products",
    description:
      "Products listed by local businesses (all statuses). Creating one here lists it under your own account and needs a verified phone, like any seller.",
    apiPath: "/marketplace/products",
    listPath: "/marketplace/products/all",
    requiresAuth: true,
    columns: LISTING_COLUMNS,
    fields: LISTING_FIELDS,
  },
  faqs: {
    key: "faqs",
    label: "FAQs",
    description: "Frequently asked questions, used by the AI chatbot's knowledge base.",
    apiPath: "/faqs",
    listPath: "/faqs/all",
    requiresAuth: true,
    supportsEdit: true,
    columns: [
      { key: "question", label: "Question" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "question", label: "Question", type: "text", required: true, localized: true },
      { name: "answer", label: "Answer", type: "textarea", required: true, localized: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "published", label: "Published" },
          { value: "draft", label: "Draft" },
        ],
      },
    ],
  },
  exchange: {
    key: "exchange",
    label: "Exchange listings",
    description:
      "C2C classifieds (all statuses). Creating one here lists it under your own account and needs a verified phone, like any seller.",
    apiPath: "/exchange/listings",
    listPath: "/exchange/listings/all",
    requiresAuth: true,
    columns: LISTING_COLUMNS,
    fields: [
      ...LISTING_FIELDS,
      { name: "is_negotiable", label: "Price is negotiable", type: "checkbox" },
    ],
  },
  shops: {
    key: "shops",
    label: "Shops",
    description:
      "Shops inside a market/bazaar (all statuses). Creating one here lists it under your own account and needs a verified phone, like any shopkeeper.",
    apiPath: "/shops",
    listPath: "/shops/all",
    requiresAuth: true,
    supportsEdit: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "market_name", label: "Market" },
      { key: "category_name", label: "Category" },
      { key: "is_featured", label: "Featured" },
      { key: "status", label: "Status" },
      { key: "moderation_status", label: "Moderation" },
    ],
    fields: [
      {
        name: "market_id",
        label: "Market (optional - leave unset for a standalone shop)",
        type: "select",
        optionsSource: "markets",
      },
      {
        name: "location_id",
        label: "Location (required only when no market is chosen)",
        type: "select",
        optionsSource: "locations",
      },
      { name: "category_id", label: "Category", type: "select", required: true, optionsSource: "shopCategories" },
      { name: "name", label: "Shop name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "is_featured",
        label: "Feature on the market page",
        type: "checkbox",
        help: "Only takes effect when saved by a moderator/admin - a shopkeeper editing their own listing can't set this.",
      },
      { name: "contact_phone", label: "Contact phone", type: "text" },
      { name: "images", label: "Photo URLs", type: "text", isCommaList: true, help: "Comma-separated https URLs" },
    ],
  },
  representatives: {
    key: "representatives",
    label: "Union representatives",
    description:
      "Chairman / reserved women member / ward member directory. The linked person needs their own account first (registers like any citizen); look up their id on the Users page.",
    apiPath: "/representatives",
    supportsEdit: true,
    columns: [
      { key: "full_name", label: "Name" },
      { key: "position", label: "Position" },
      { key: "location_name", label: "Location" },
      { key: "status", label: "Status" },
    ],
    fields: [
      { name: "user_id", label: "User ID", type: "text", required: true, help: "Copy the user's ID from /admin/users" },
      { name: "location_id", label: "Location (union or village)", type: "select", required: true, optionsSource: "locations" },
      {
        name: "position",
        label: "Position",
        type: "select",
        required: true,
        options: [
          { value: "chairman", label: "Chairman" },
          { value: "women_member", label: "Reserved women member" },
          { value: "ward_member", label: "Ward member" },
        ],
      },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "photo_url", label: "Photo URL", type: "text" },
    ],
  },
};

async function resolveFieldOptions(field: EntityField): Promise<EntityField> {
  if (!field.optionsSource) return field;

  if (field.optionsSource === "locations") {
    return { ...field, options: await getLocationOptions() };
  }
  if (field.optionsSource === "serviceCategories") {
    const categories = await apiGet<ServiceCategory[]>("/services/categories");
    return { ...field, options: categories.map((c) => ({ value: c.id, label: c.name })) };
  }
  if (field.optionsSource === "newsSources") {
    const sources = await apiGet<NewsSource[]>("/news/sources");
    return { ...field, options: sources.map((s) => ({ value: s.id, label: s.name })) };
  }
  if (field.optionsSource === "marketplaceCategories") {
    const categories = await getCategories();
    return { ...field, options: categories.map((c) => ({ value: c.id, label: c.name })) };
  }
  if (field.optionsSource === "markets") {
    const markets = await apiGet<Paginated<Market>>("/markets", { searchParams: { page_size: "60" } });
    return { ...field, options: markets.items.map((m) => ({ value: m.id, label: m.name })) };
  }
  if (field.optionsSource === "shopCategories") {
    const categories = await apiGet<ShopCategory[]>("/shops/categories");
    return { ...field, options: categories.map((c) => ({ value: c.id, label: c.name })) };
  }
  return field;
}

/** Resolves every field's `optionsSource` into concrete `options` for the
 * new/edit admin forms. Shared so both routes stay in sync — they used to
 * carry their own copy of this and drift apart (the edit page silently lost
 * the "markets"/"shopCategories" cases, leaving shop-edit dropdowns empty). */
export function resolveEntityFields(fields: EntityField[]): Promise<EntityField[]> {
  return Promise.all(fields.map(resolveFieldOptions));
}
