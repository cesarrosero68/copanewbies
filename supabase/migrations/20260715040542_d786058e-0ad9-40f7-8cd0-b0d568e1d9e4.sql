
-- Extend tournaments table with year, semester, status
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS semester text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Backfill existing tournament as Copa Newbies II
UPDATE public.tournaments
SET name = 'Copa Newbies II',
    year = 2026,
    semester = '2026-1',
    status = 'active'
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Allow public read of tournaments (needed for editions page)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tournaments' AND policyname='Public can read tournaments'
  ) THEN
    CREATE POLICY "Public can read tournaments" ON public.tournaments FOR SELECT USING (true);
  END IF;
END $$;
GRANT SELECT ON public.tournaments TO anon;

-- Add tournament_id to penalty_events and skills_* tables
ALTER TABLE public.penalty_events
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES public.tournaments(id);

ALTER TABLE public.skills_players
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES public.tournaments(id);

ALTER TABLE public.skills_results
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES public.tournaments(id);

ALTER TABLE public.skills_point_tables
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES public.tournaments(id);

ALTER TABLE public.skills_users
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES public.tournaments(id);

-- Backfill all existing rows to Copa Newbies II
UPDATE public.penalty_events SET tournament_id = 'a0000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;
UPDATE public.skills_players SET tournament_id = 'a0000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;
UPDATE public.skills_results SET tournament_id = 'a0000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;
UPDATE public.skills_point_tables SET tournament_id = 'a0000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;
UPDATE public.skills_users SET tournament_id = 'a0000000-0000-0000-0000-000000000001' WHERE tournament_id IS NULL;

-- Ensure only ONE active tournament at a time
CREATE UNIQUE INDEX IF NOT EXISTS tournaments_one_active_idx
  ON public.tournaments (status) WHERE status = 'active';
