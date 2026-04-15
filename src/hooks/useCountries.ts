import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CountryRow {
  id: string;
  name: string;
  name_en: string;
  code: string;
  flag: string;
  sort_order: number;
  continent: string;
}

export const CONTINENT_LABELS: Record<string, string> = {
  "asia": "🌏 এশিয়া",
  "europe": "🌍 ইউরোপ",
  "americas": "🌎 আমেরিকা",
  "africa": "🌍 আফ্রিকা",
  "middle-east": "🕌 মধ্যপ্রাচ্য",
  "oceania": "🌊 ওশেনিয়া",
  "other": "🌐 অন্যান্য",
};

export const CONTINENT_ORDER = ["asia", "middle-east", "europe", "americas", "africa", "oceania", "other"];

export interface SubCategoryRow {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  sort_order: number;
}

export interface FeaturedPostRow {
  id: string;
  title: string;
  url: string;
  image_url: string | null;
  description: string | null;
  source_name: string | null;
  auto_fetch: boolean;
  fetch_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as CountryRow[];
    },
  });
}

export function useSubCategories() {
  return useQuery({
    queryKey: ["sub_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sub_categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as SubCategoryRow[];
    },
  });
}

export function useFeaturedPosts() {
  return useQuery({
    queryKey: ["featured_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_posts")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as FeaturedPostRow[];
    },
  });
}

export function useAddCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (country: Omit<CountryRow, "sort_order"> & { sort_order?: number }) => {
      const { error } = await supabase.from("countries").insert(country as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["countries"] }),
  });
}

export function useAddSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: Omit<SubCategoryRow, "sort_order"> & { sort_order?: number }) => {
      const { error } = await supabase.from("sub_categories").insert(sub as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sub_categories"] }),
  });
}

export function useAddFeaturedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Partial<FeaturedPostRow>) => {
      const { error } = await supabase.from("featured_posts").insert(post as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured_posts"] }),
  });
}

export function useUpdateFeaturedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeaturedPostRow> & { id: string }) => {
      const { error } = await supabase.from("featured_posts").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured_posts"] }),
  });
}

export function useDeleteFeaturedPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("featured_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["featured_posts"] }),
  });
}
