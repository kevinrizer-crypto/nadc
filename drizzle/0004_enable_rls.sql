-- Security: enable Row-Level Security on every public-schema table.
--
-- Supabase auto-exposes public tables via its PostgREST Data API to the `anon`
-- role, whose key is designed to be distributable. With RLS off, that means
-- "anyone can read/edit/delete." We do NOT use the Data API — the app connects
-- over the direct Postgres connection as the `postgres` role, which has
-- BYPASSRLS, so it is unaffected by these statements.
--
-- Enabling RLS with NO policies = deny-by-default for anon/authenticated (the
-- API roles), full access for the bypassrls app role. This is the correct
-- lockdown for a service-connection-only database.
--
-- Convention: every new table added in a later migration MUST also
-- `ENABLE ROW LEVEL SECURITY`.

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
