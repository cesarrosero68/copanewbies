
-- Add appearance columns to tournaments
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS header_color text DEFAULT '#1a1a2e',
  ADD COLUMN IF NOT EXISTS footer_color text DEFAULT '#1a1a2e',
  ADD COLUMN IF NOT EXISTS bg_color    text DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS title_color text DEFAULT '#ff1493',
  ADD COLUMN IF NOT EXISTS text_color  text DEFAULT '#1a1a2e',
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'inter',
  ADD COLUMN IF NOT EXISTS font_size   text DEFAULT '16';

-- Grant admin role to admin@reapershockeyclub.site if the user exists in auth.users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email = 'admin@reapershockeyclub.site'
ON CONFLICT DO NOTHING;
