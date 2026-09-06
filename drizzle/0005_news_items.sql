-- External news coverage: curated links to third-party reporting about data
-- centers, with a human approval step before anything is shown publicly.

CREATE TYPE news_item_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS news_items (
  id             serial PRIMARY KEY,
  -- Unique so re-running the fetcher is idempotent (see scripts/fetch-news.ts).
  url            text NOT NULL UNIQUE,
  title          text NOT NULL,
  publisher      varchar(160),
  summary        text,
  published_at   timestamptz,
  state          varchar(2),
  project_id     integer REFERENCES projects(id) ON DELETE SET NULL,
  status         news_item_status NOT NULL DEFAULT 'pending',
  discovered_via varchar(120) NOT NULL DEFAULT 'manual',
  admin_notes    text,
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_items_status_idx ON news_items (status, published_at);

-- Convention from 0004: every new table enables RLS. The app connects as a
-- BYPASSRLS role, so this only closes the Supabase Data API surface.
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
