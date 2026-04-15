
-- Countries table
CREATE TABLE public.countries (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_en text NOT NULL,
  code text NOT NULL,
  flag text NOT NULL DEFAULT '🏳️',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Countries viewable by everyone" ON public.countries FOR SELECT USING (true);
CREATE POLICY "Admins can insert countries" ON public.countries FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update countries" ON public.countries FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete countries" ON public.countries FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Sub-categories table
CREATE TABLE public.sub_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  name_en text NOT NULL,
  icon text NOT NULL DEFAULT '📂',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sub-categories viewable by everyone" ON public.sub_categories FOR SELECT USING (true);
CREATE POLICY "Admins can insert sub_categories" ON public.sub_categories FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update sub_categories" ON public.sub_categories FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sub_categories" ON public.sub_categories FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Featured posts table
CREATE TABLE public.featured_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  image_url text,
  description text,
  source_name text,
  auto_fetch boolean NOT NULL DEFAULT false,
  fetch_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured posts viewable by everyone" ON public.featured_posts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all featured posts" ON public.featured_posts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert featured_posts" ON public.featured_posts FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update featured_posts" ON public.featured_posts FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete featured_posts" ON public.featured_posts FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_featured_posts_updated_at
  BEFORE UPDATE ON public.featured_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add country_id and sub_category_id to links
ALTER TABLE public.links ADD COLUMN country_id text REFERENCES public.countries(id);
ALTER TABLE public.links ADD COLUMN sub_category_id text REFERENCES public.sub_categories(id);

-- Scraper settings table for admin
CREATE TABLE public.scraper_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_url text NOT NULL,
  target_country_id text REFERENCES public.countries(id),
  target_category_id text REFERENCES public.categories(id),
  target_sub_category_id text REFERENCES public.sub_categories(id),
  selector_links text,
  selector_title text,
  selector_logo text,
  is_active boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scraper_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view scraper configs" ON public.scraper_configs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert scraper configs" ON public.scraper_configs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update scraper configs" ON public.scraper_configs FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete scraper configs" ON public.scraper_configs FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Insert default countries
INSERT INTO public.countries (id, name, name_en, code, flag, sort_order) VALUES
  ('bd', 'বাংলাদেশ', 'Bangladesh', 'BD', '🇧🇩', 1),
  ('in', 'ভারত', 'India', 'IN', '🇮🇳', 2),
  ('us', 'যুক্তরাষ্ট্র', 'United States', 'US', '🇺🇸', 3),
  ('gb', 'যুক্তরাজ্য', 'United Kingdom', 'GB', '🇬🇧', 4),
  ('pk', 'পাকিস্তান', 'Pakistan', 'PK', '🇵🇰', 5),
  ('sa', 'সৌদি আরব', 'Saudi Arabia', 'SA', '🇸🇦', 6),
  ('ae', 'সংযুক্ত আরব আমিরাত', 'UAE', 'AE', '🇦🇪', 7),
  ('my', 'মালয়েশিয়া', 'Malaysia', 'MY', '🇲🇾', 8),
  ('jp', 'জাপান', 'Japan', 'JP', '🇯🇵', 9),
  ('au', 'অস্ট্রেলিয়া', 'Australia', 'AU', '🇦🇺', 10),
  ('ca', 'কানাডা', 'Canada', 'CA', '🇨🇦', 11),
  ('de', 'জার্মানি', 'Germany', 'DE', '🇩🇪', 12),
  ('fr', 'ফ্রান্স', 'France', 'FR', '🇫🇷', 13),
  ('np', 'নেপাল', 'Nepal', 'NP', '🇳🇵', 14),
  ('lk', 'শ্রীলঙ্কা', 'Sri Lanka', 'LK', '🇱🇰', 15);

-- Insert default sub-categories
INSERT INTO public.sub_categories (id, name, name_en, icon, sort_order) VALUES
  ('print-daily', 'প্রিন্ট দৈনিক', 'Print Daily', '📰', 1),
  ('epaper', 'ই-পেপার', 'E-Paper', '📱', 2),
  ('online-news', 'অনলাইন নিউজ পোর্টাল', 'Online News Portal', '🌐', 3),
  ('regional-news', 'বিভাগীয় নিউজ সাইট', 'Regional News', '🗺️', 4),
  ('gov-website', 'সরকারি ওয়েবসাইট', 'Government Website', '🏛️', 5),
  ('tv-channel', 'টিভি চ্যানেল', 'TV Channel', '📺', 6),
  ('magazine', 'ম্যাগাজিন', 'Magazine', '📖', 7),
  ('blog', 'ব্লগ', 'Blog', '✍️', 8),
  ('sports', 'খেলাধুলা', 'Sports', '⚽', 9),
  ('tech', 'প্রযুক্তি', 'Technology', '💻', 10),
  ('education', 'শিক্ষা', 'Education', '🎓', 11),
  ('business', 'ব্যবসা-বাণিজ্য', 'Business', '💼', 12);
