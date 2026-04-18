-- 1. Storage bucket for site assets (logos, etc)
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for site-assets
CREATE POLICY "Site assets are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Admin upload/update/delete
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

-- 2. Scraper auto-run columns
ALTER TABLE public.scraper_configs
  ADD COLUMN IF NOT EXISTS auto_run boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS run_interval_hours integer NOT NULL DEFAULT 6;

-- 3. Default featured_count site setting
INSERT INTO public.site_settings (key, value)
VALUES ('featured_count', '6'::jsonb)
ON CONFLICT (key) DO NOTHING;