import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
  doublePrecision,
  jsonb,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Tracker
// ---------------------------------------------------------------------------

export const projectStatus = pgEnum("project_status", [
  "proposed",
  "contested",
  "approved",
  "withdrawn",
  "blocked",
  "canceled",
  "delayed",
  "operating",
  "under_construction",
]);

// Trust tiers: see drizzle/0001_verification_tier.sql. Public pages label
// every entry with its tier; "lead" entries stay unpublished.
export const verificationTier = pgEnum("verification_tier", ["verified", "corroborated", "lead"]);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: text("name").notNull(),
    developer: text("developer"),
    city: text("city"),
    county: text("county"),
    state: varchar("state", { length: 2 }).notNull(),
    nearestZip: varchar("nearest_zip", { length: 10 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    status: projectStatus("status").notNull().default("proposed"),
    // Free-text qualifier preserved from source data, e.g. "Proposed/Expanding",
    // "Blocked (temp)" — the enum above powers filters; this powers display.
    statusDetail: text("status_detail"),
    capacity: text("capacity"), // e.g. "~2GW", "4.4M sq ft" — heterogeneous units
    investment: text("investment"),
    notes: text("notes"),
    municipalityUrl: text("municipality_url"),
    oppositionGroup: text("opposition_group"),
    oppositionGroupUrl: text("opposition_group_url"),
    nextHearingDate: date("next_hearing_date"),
    nextHearingDetails: text("next_hearing_details"),
    // [{ url, label, accessedAt }] — every entry must carry at least one source.
    sources: jsonb("sources").$type<{ url: string; label?: string; accessedAt?: string }[]>().notNull().default([]),
    // Editorial verification state. Entries render a "last verified" stamp;
    // anything stale or unverified is flagged in admin and labeled on the page.
    verificationTier: verificationTier("verification_tier").notNull().default("lead"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verificationNote: text("verification_note"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("projects_state_slug_idx").on(t.state, t.slug),
    index("projects_status_idx").on(t.status),
    index("projects_published_idx").on(t.published),
  ]
);

// Decision-makers attached to a project. Public-office contact channels only —
// editorial principle #5 forbids publishing personal information.
export const projectContacts = pgTable("project_contacts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role"), // e.g. "County Commissioner, District 3"
  officeEmail: text("office_email"),
  officePhone: text("office_phone"),
  officeUrl: text("office_url"),
});

// ---------------------------------------------------------------------------
// Tip intake — the growth loop that feeds the tracker
// ---------------------------------------------------------------------------

export const tipStatus = pgEnum("tip_status", ["pending", "reviewing", "promoted", "rejected", "duplicate"]);

export const tips = pgTable(
  "tips",
  {
    id: serial("id").primaryKey(),
    reporterName: text("reporter_name"), // optional — tipsters may stay anonymous
    reporterEmail: text("reporter_email").notNull(),
    locationText: text("location_text").notNull(), // address / city / county as given
    state: varchar("state", { length: 2 }),
    zip: varchar("zip", { length: 10 }),
    message: text("message").notNull(),
    links: jsonb("links").$type<string[]>().notNull().default([]),
    consent: boolean("consent").notNull().default(false),
    status: tipStatus("status").notNull().default("pending"),
    adminNotes: text("admin_notes"),
    promotedProjectId: integer("promoted_project_id").references(() => projects.id, { onDelete: "set null" }),
    // Stored for abuse triage only; never displayed. Tipster data is sensitive.
    submitterIpHash: varchar("submitter_ip_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tips_status_idx").on(t.status)]
);

// ---------------------------------------------------------------------------
// Subscribers — email (double opt-in) and SMS (express consent, 10DLC)
// ---------------------------------------------------------------------------

export const optInStatus = pgEnum("opt_in_status", ["pending", "confirmed", "unsubscribed"]);

export const subscribers = pgTable(
  "subscribers",
  {
    id: serial("id").primaryKey(),
    email: text("email"),
    phone: varchar("phone", { length: 20 }), // E.164
    emailStatus: optInStatus("email_status"),
    smsStatus: optInStatus("sms_status"),
    // Granular preferences: national newsletter, per-state alerts, per-ZIP
    // alerts ("alert me about projects near 30223"), per-project alerts.
    preferences: jsonb("preferences")
      .$type<{ national: boolean; states: string[]; zips: string[]; projectIds: number[] }>()
      .notNull()
      .default({ national: true, states: [], zips: [], projectIds: [] }),
    confirmToken: varchar("confirm_token", { length: 64 }),
    confirmTokenExpiresAt: timestamp("confirm_token_expires_at", { withTimezone: true }),
    unsubscribeToken: varchar("unsubscribe_token", { length: 64 }).notNull(),
    espContactId: text("esp_contact_id"), // ID at the email provider, once synced
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("subscribers_email_idx").on(t.email), index("subscribers_phone_idx").on(t.phone)]
);

// Immutable consent log — required evidence for CAN-SPAM and SMS/10DLC audits.
export const consentEvents = pgTable("consent_events", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id")
    .notNull()
    .references(() => subscribers.id, { onDelete: "cascade" }),
  channel: varchar("channel", { length: 10 }).notNull(), // "email" | "sms"
  action: varchar("action", { length: 30 }).notNull(), // signup | confirm | unsubscribe | stop | help
  detail: text("detail"), // e.g. the exact consent language shown at signup
  ipHash: varchar("ip_hash", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Donations (Stripe)
// ---------------------------------------------------------------------------

export const donations = pgTable(
  "donations",
  {
    id: serial("id").primaryKey(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSessionId: text("stripe_session_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    email: text("email"),
    amountCents: integer("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    recurring: boolean("recurring").notNull().default(false),
    status: varchar("status", { length: 30 }).notNull().default("pending"), // pending | completed | active | canceled | failed
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("donations_session_idx").on(t.stripeSessionId)]
);

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    priceCents: integer("price_cents").notNull(),
    category: varchar("category", { length: 40 }).notNull(), // signs | print | apparel | bundle
    imageUrl: text("image_url"),
    customizable: boolean("customizable").notNull().default(false),
    badge: text("badge"),
    variants: jsonb("variants").$type<string[]>().notNull().default([]),
    podProductId: text("pod_product_id"), // legacy single-variant Printful id
    // Maps each variant label → Printful sync_variant_id. Single-variant
    // products use the "" key. Powers auto-fulfillment.
    podVariantMap: jsonb("pod_variant_map").$type<Record<string, string>>().notNull().default({}),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  }
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    stripeSessionId: text("stripe_session_id").notNull(),
    email: text("email"),
    amountCents: integer("amount_cents").notNull(),
    status: varchar("status", { length: 30 }).notNull().default("pending"), // pending | paid | fulfilled | canceled
    shippingAddress: jsonb("shipping_address"),
    podOrderId: text("pod_order_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("orders_session_idx").on(t.stripeSessionId)]
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  variant: text("variant"),
  customization: text("customization"), // e.g. the [TOWN] text for custom yard signs
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(),
});

// ---------------------------------------------------------------------------
// Petitions
// ---------------------------------------------------------------------------

export const petitions = pgTable("petitions", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  goal: integer("goal").notNull().default(500),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const petitionSignatures = pgTable(
  "petition_signatures",
  {
    id: serial("id").primaryKey(),
    petitionId: integer("petition_id")
      .notNull()
      .references(() => petitions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    zip: varchar("zip", { length: 10 }),
    comment: text("comment"),
    displayPublicly: boolean("display_publicly").notNull().default(false),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("petition_sig_unique_idx").on(t.petitionId, t.email)]
);

// ---------------------------------------------------------------------------
// News / blog
// ---------------------------------------------------------------------------

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    bodyMd: text("body_md").notNull(),
    kind: varchar("kind", { length: 20 }).notNull().default("analysis"), // roundup | analysis
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Single-use magic-link tokens (stored hashed) for admin sign-in.
export const loginTokens = pgTable("login_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// DB-backed fixed-window rate limiting — works across serverless instances.
export const rateLimits = pgTable(
  "rate_limits",
  {
    id: serial("id").primaryKey(),
    bucket: varchar("bucket", { length: 120 }).notNull(), // e.g. "tips:<iphash>"
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(1),
  },
  (t) => [uniqueIndex("rate_limits_bucket_idx").on(t.bucket, t.windowStart)]
);
