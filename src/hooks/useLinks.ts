import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LinkRow {
  id: string;
  title: string;
  url: string;
  category_id: string;
  favicon: string | null;
  visits: number;
  status: string;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  sort_order: number;
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as CategoryRow[];
    },
  });
}

export function useLinks(categoryId?: string) {
  return useQuery({
    queryKey: ["links", categoryId],
    queryFn: async () => {
      let query = supabase
        .from("links")
        .select("*")
        .eq("status", "approved")
        .order("visits", { ascending: false });

      if (categoryId && categoryId !== "all") {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LinkRow[];
    },
  });
}

export function useAllLinks() {
  return useQuery({
    queryKey: ["all-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("visits", { ascending: false });
      if (error) throw error;
      return data as LinkRow[];
    },
  });
}

export function useSubmitLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (link: { title: string; url: string; category_id: string }) => {
      const { error } = await supabase.from("links").insert({
        title: link.title,
        url: link.url,
        category_id: link.category_id,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
  });
}
