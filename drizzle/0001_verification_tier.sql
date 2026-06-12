-- Three-tier verification model:
--   verified     — human/primary-source confirmed (green stamp)
--   corroborated — 2+ independent reputable sources, auto-enriched; published
--                  with a "help us verify" prompt
--   lead         — single secondary source; stays unpublished pending review
CREATE TYPE "verification_tier" AS ENUM ('verified','corroborated','lead');

ALTER TABLE "projects" ADD COLUMN "verification_tier" "verification_tier" NOT NULL DEFAULT 'lead';

-- The seed dataset was hand-verified against sources at compile time.
UPDATE "projects" SET "verification_tier" = 'verified' WHERE "verified_at" IS NOT NULL;

-- Imported operating/buildout facilities need a real status value.
ALTER TYPE "project_status" ADD VALUE IF NOT EXISTS 'under_construction';
