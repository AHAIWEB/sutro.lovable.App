import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdSlot {
  enabled: boolean;
  html: string; // raw HTML / AdSense snippet / image+link markup
  image_url?: string; // uploaded image URL (PNG/JPG)
  link_url?: string;  // optional click-through URL for the image
  alt?: string;       // optional alt text for the image
}

export interface SiteSettingsMap {
  site_name: string;
  site_tagline: string;
  logo_url: string;
  logo_url_dark: string;
  logo_size: "small" | "medium" | "large";
  logo_emoji: string;
  footer_text: string;
  footer_links: { label: string; url: string }[];
  header_menu: { label: string; url: string }[];
  primary_color: string;
  accent_color: string;
  featured_count: number;
  featured_layout: "carousel" | "magazine" | "minimal" | "hero-sidebar";
  font_heading: string;
  font_body: string;
  ad_top: AdSlot;        // below header
  ad_mid: AdSlot;        // between featured and grid
  ad_bottom: AdSlot;     // before footer
}

const DEFAULTS: SiteSettingsMap = {
  site_name: "সূত্র",
  site_tagline: "বাংলা ওয়েব লিংক ডিরেক্টরি",
  logo_url: "",
  logo_url_dark: "",
  logo_size: "medium",
  logo_emoji: "📚",
  footer_text: "© ২০২৬ সূত্র। সকল অধিকার সংরক্ষিত।",
  footer_links: [],
  header_menu: [],
  primary_color: "#0d9488",
  accent_color: "#f59e0b",
  featured_count: 6,
  featured_layout: "carousel",
  font_heading: "Hind Siliguri",
  font_body: "Noto Sans Bengali",
  ad_top: { enabled: false, html: "" },
  ad_mid: { enabled: false, html: "" },
  ad_bottom: { enabled: false, html: "" },
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettingsMap> => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: any = { ...DEFAULTS };
      (data || []).forEach((row: any) => {
        if (row.key in DEFAULTS) map[row.key] = row.value;
      });
      return map as SiteSettingsMap;
    },
    staleTime: 60_000,
  });
}

export function useUpdateSiteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof SiteSettingsMap; value: any }) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key, value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["site-settings"] }),
  });
}

// Curated Bengali-friendly Google Fonts
export const GOOGLE_FONTS = [
  "Hind Siliguri",
  "Noto Sans Bengali",
  "Noto Serif Bengali",
  "Tiro Bangla",
  "Baloo Da 2",
  "Mina",
  "Galada",
  "Atma",
  "Inter",
  "Poppins",
  "Manrope",
  "Roboto",
  "Lora",
  "Playfair Display",
  "Merriweather",
];
