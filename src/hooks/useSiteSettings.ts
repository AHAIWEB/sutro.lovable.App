import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettingsMap {
  site_name: string;
  site_tagline: string;
  logo_url: string;
  logo_emoji: string;
  footer_text: string;
  footer_links: { label: string; url: string }[];
  header_menu: { label: string; url: string }[];
  primary_color: string;
  accent_color: string;
  featured_count: number;
  featured_layout: "carousel" | "magazine" | "minimal";
}

const DEFAULTS: SiteSettingsMap = {
  site_name: "সূত্র",
  site_tagline: "বাংলা ওয়েব লিংক ডিরেক্টরি",
  logo_url: "",
  logo_emoji: "📚",
  footer_text: "© ২০২৬ সূত্র। সকল অধিকার সংরক্ষিত।",
  footer_links: [],
  header_menu: [],
  primary_color: "#0d9488",
  accent_color: "#f59e0b",
  featured_count: 6,
  featured_layout: "carousel",
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
