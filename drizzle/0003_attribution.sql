-- First-touch marketing attribution. Stamped on subscribers and donations so
-- we can compute true cost-per-email and cost-per-donor by campaign/source.
-- Shape: { source, medium, campaign, content, term, landing, ts }
ALTER TABLE "subscribers" ADD COLUMN "attribution" jsonb;
ALTER TABLE "donations" ADD COLUMN "attribution" jsonb;
