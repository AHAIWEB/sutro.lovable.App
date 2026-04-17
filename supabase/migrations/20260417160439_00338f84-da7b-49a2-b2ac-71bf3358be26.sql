-- Create site_settings table for admin-controlled customization
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings viewable by everyone"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site settings"
ON public.site_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', '"সূত্র"'::jsonb),
  ('site_tagline', '"বাংলা ওয়েব লিংক ডিরেক্টরি"'::jsonb),
  ('logo_url', '""'::jsonb),
  ('logo_emoji', '"📚"'::jsonb),
  ('footer_text', '"© ২০২৬ সূত্র। সকল অধিকার সংরক্ষিত।"'::jsonb),
  ('footer_links', '[]'::jsonb),
  ('header_menu', '[]'::jsonb),
  ('primary_color', '"#0d9488"'::jsonb),
  ('accent_color', '"#f59e0b"'::jsonb);