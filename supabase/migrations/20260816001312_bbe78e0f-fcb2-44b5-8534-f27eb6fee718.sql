GRANT SELECT ON public.tournament_awards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_awards TO authenticated;
GRANT ALL ON public.tournament_awards TO service_role;

GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;

ALTER TABLE public.tournament_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tournament_awards" ON public.tournament_awards;
CREATE POLICY "Public read tournament_awards" ON public.tournament_awards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin insert tournament_awards" ON public.tournament_awards;
CREATE POLICY "Admin insert tournament_awards" ON public.tournament_awards FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin update tournament_awards" ON public.tournament_awards;
CREATE POLICY "Admin update tournament_awards" ON public.tournament_awards FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin delete tournament_awards" ON public.tournament_awards;
CREATE POLICY "Admin delete tournament_awards" ON public.tournament_awards FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));