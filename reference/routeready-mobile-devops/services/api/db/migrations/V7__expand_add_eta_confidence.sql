-- Expand only. Nullable, no default rewrite, safe for v1 readers.
ALTER TABLE route_status ADD COLUMN IF NOT EXISTS eta_confidence numeric NULL;
