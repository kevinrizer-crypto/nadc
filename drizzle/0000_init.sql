-- NADC initial schema. Apply with `npm run db:migrate` (or psql -f).

CREATE TYPE "project_status" AS ENUM ('proposed','contested','approved','withdrawn','blocked','canceled','delayed','operating');
CREATE TYPE "tip_status" AS ENUM ('pending','reviewing','promoted','rejected','duplicate');
CREATE TYPE "opt_in_status" AS ENUM ('pending','confirmed','unsubscribed');

CREATE TABLE "projects" (
  "id" serial PRIMARY KEY,
  "slug" varchar(160) NOT NULL,
  "name" text NOT NULL,
  "developer" text,
  "city" text,
  "county" text,
  "state" varchar(2) NOT NULL,
  "nearest_zip" varchar(10),
  "latitude" double precision,
  "longitude" double precision,
  "status" "project_status" NOT NULL DEFAULT 'proposed',
  "status_detail" text,
  "capacity" text,
  "investment" text,
  "notes" text,
  "municipality_url" text,
  "opposition_group" text,
  "opposition_group_url" text,
  "next_hearing_date" date,
  "next_hearing_details" text,
  "sources" jsonb NOT NULL DEFAULT '[]',
  "verified_at" timestamptz,
  "verification_note" text,
  "published" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "projects_state_slug_idx" ON "projects" ("state","slug");
CREATE INDEX "projects_status_idx" ON "projects" ("status");
CREATE INDEX "projects_published_idx" ON "projects" ("published");

CREATE TABLE "project_contacts" (
  "id" serial PRIMARY KEY,
  "project_id" integer NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "role" text,
  "office_email" text,
  "office_phone" text,
  "office_url" text
);

CREATE TABLE "tips" (
  "id" serial PRIMARY KEY,
  "reporter_name" text,
  "reporter_email" text NOT NULL,
  "location_text" text NOT NULL,
  "state" varchar(2),
  "zip" varchar(10),
  "message" text NOT NULL,
  "links" jsonb NOT NULL DEFAULT '[]',
  "consent" boolean NOT NULL DEFAULT false,
  "status" "tip_status" NOT NULL DEFAULT 'pending',
  "admin_notes" text,
  "promoted_project_id" integer REFERENCES "projects"("id") ON DELETE SET NULL,
  "submitter_ip_hash" varchar(64),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX "tips_status_idx" ON "tips" ("status");

CREATE TABLE "subscribers" (
  "id" serial PRIMARY KEY,
  "email" text,
  "phone" varchar(20),
  "email_status" "opt_in_status",
  "sms_status" "opt_in_status",
  "preferences" jsonb NOT NULL DEFAULT '{"national":true,"states":[],"zips":[],"projectIds":[]}',
  "confirm_token" varchar(64),
  "confirm_token_expires_at" timestamptz,
  "unsubscribe_token" varchar(64) NOT NULL,
  "esp_contact_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" ("email");
CREATE INDEX "subscribers_phone_idx" ON "subscribers" ("phone");

CREATE TABLE "consent_events" (
  "id" serial PRIMARY KEY,
  "subscriber_id" integer NOT NULL REFERENCES "subscribers"("id") ON DELETE CASCADE,
  "channel" varchar(10) NOT NULL,
  "action" varchar(30) NOT NULL,
  "detail" text,
  "ip_hash" varchar(64),
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "donations" (
  "id" serial PRIMARY KEY,
  "stripe_customer_id" text,
  "stripe_session_id" text,
  "stripe_subscription_id" text,
  "email" text,
  "amount_cents" integer NOT NULL,
  "currency" varchar(3) NOT NULL DEFAULT 'usd',
  "recurring" boolean NOT NULL DEFAULT false,
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "donations_session_idx" ON "donations" ("stripe_session_id");

CREATE TABLE "products" (
  "id" serial PRIMARY KEY,
  "slug" varchar(120) NOT NULL UNIQUE,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "price_cents" integer NOT NULL,
  "category" varchar(40) NOT NULL,
  "image_url" text,
  "customizable" boolean NOT NULL DEFAULT false,
  "badge" text,
  "variants" jsonb NOT NULL DEFAULT '[]',
  "pod_product_id" text,
  "active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE TABLE "orders" (
  "id" serial PRIMARY KEY,
  "stripe_session_id" text NOT NULL,
  "email" text,
  "amount_cents" integer NOT NULL,
  "status" varchar(30) NOT NULL DEFAULT 'pending',
  "shipping_address" jsonb,
  "pod_order_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "orders_session_idx" ON "orders" ("stripe_session_id");

CREATE TABLE "order_items" (
  "id" serial PRIMARY KEY,
  "order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
  "product_name" text NOT NULL,
  "variant" text,
  "customization" text,
  "quantity" integer NOT NULL DEFAULT 1,
  "unit_price_cents" integer NOT NULL
);

CREATE TABLE "petitions" (
  "id" serial PRIMARY KEY,
  "slug" varchar(160) NOT NULL UNIQUE,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "project_id" integer REFERENCES "projects"("id") ON DELETE SET NULL,
  "goal" integer NOT NULL DEFAULT 500,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "petition_signatures" (
  "id" serial PRIMARY KEY,
  "petition_id" integer NOT NULL REFERENCES "petitions"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "zip" varchar(10),
  "comment" text,
  "display_publicly" boolean NOT NULL DEFAULT false,
  "ip_hash" varchar(64),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "petition_sig_unique_idx" ON "petition_signatures" ("petition_id","email");

CREATE TABLE "posts" (
  "id" serial PRIMARY KEY,
  "slug" varchar(160) NOT NULL UNIQUE,
  "title" text NOT NULL,
  "excerpt" text,
  "body_md" text NOT NULL,
  "kind" varchar(20) NOT NULL DEFAULT 'analysis',
  "published" boolean NOT NULL DEFAULT false,
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "admins" (
  "id" serial PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "login_tokens" (
  "id" serial PRIMARY KEY,
  "email" text NOT NULL,
  "token_hash" varchar(64) NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "rate_limits" (
  "id" serial PRIMARY KEY,
  "bucket" varchar(120) NOT NULL,
  "window_start" timestamptz NOT NULL,
  "count" integer NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX "rate_limits_bucket_idx" ON "rate_limits" ("bucket","window_start");
