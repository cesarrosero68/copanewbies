
CREATE OR REPLACE FUNCTION public.current_active_tournament_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.tournaments WHERE status = 'active' ORDER BY created_at DESC LIMIT 1
$$;

ALTER TABLE public.penalty_events ALTER COLUMN tournament_id SET DEFAULT public.current_active_tournament_id();
ALTER TABLE public.skills_players ALTER COLUMN tournament_id SET DEFAULT public.current_active_tournament_id();
ALTER TABLE public.skills_results ALTER COLUMN tournament_id SET DEFAULT public.current_active_tournament_id();
ALTER TABLE public.skills_point_tables ALTER COLUMN tournament_id SET DEFAULT public.current_active_tournament_id();
ALTER TABLE public.skills_users ALTER COLUMN tournament_id SET DEFAULT public.current_active_tournament_id();
