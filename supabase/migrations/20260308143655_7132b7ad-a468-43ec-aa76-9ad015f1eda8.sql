-- Add invoice chasing columns
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS last_chased_at timestamptz,
  ADD COLUMN IF NOT EXISTS chase_count integer NOT NULL DEFAULT 0;

-- Add AI insights/report caching columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_insights jsonb,
  ADD COLUMN IF NOT EXISTS ai_insights_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_report jsonb,
  ADD COLUMN IF NOT EXISTS ai_report_updated_at timestamptz;