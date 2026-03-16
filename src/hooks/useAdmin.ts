import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LinkRow, CategoryRow } from "./useLinks";

export function useIsAdmin() {
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });
}

export function useAllLinks() {
  return useQuery({
    queryKey: ["admin-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LinkRow[];
    },
  });
}

export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LinkRow> & { id: string }) => {
      const { error } = await supabase.from("links").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useAddLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (link: { title: string; url: string; category_id: string; status?: string }) => {
      const { error } = await supabase.from("links").insert({
        title: link.title,
        url: link.url,
        category_id: link.category_id,
        status: link.status || "approved",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-links"] });
      qc.invalidateQueries({ queryKey: ["links"] });
    },
  });
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: { id: string; name: string; name_en: string; icon: string; sort_order: number }) => {
      const { error } = await supabase.from("categories").insert(cat);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CategoryRow> & { id: string }) => {
      const { error } = await supabase.from("categories").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
