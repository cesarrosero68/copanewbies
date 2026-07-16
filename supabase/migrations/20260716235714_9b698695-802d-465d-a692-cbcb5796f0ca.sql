
CREATE TABLE IF NOT EXISTS public.site_theme (
  id integer PRIMARY KEY DEFAULT 1,
  primary_color text NOT NULL DEFAULT '#ff1493',
  accent_color text NOT NULL DEFAULT '#a8d400',
  background_color text NOT NULL DEFAULT '#0f1117',
  text_color text NOT NULL DEFAULT '#ffffff',
  border_color text NOT NULL DEFAULT '#2a2a3e',
  font_size_base text NOT NULL DEFAULT '16',
  font_family text NOT NULL DEFAULT 'inter',
  logo_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_theme_single_row CHECK (id = 1)
);

GRANT SELECT ON public.site_theme TO anon, authenticated;
GRANT ALL ON public.site_theme TO service_role;
GRANT INSERT, UPDATE ON public.site_theme TO authenticated;

ALTER TABLE public.site_theme ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_theme" ON public.site_theme FOR SELECT USING (true);
CREATE POLICY "Admin insert site_theme" ON public.site_theme FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update site_theme" ON public.site_theme FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.site_theme (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
