import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get all auto_fetch posts grouped by fetch_url
    const { data: posts, error } = await supabase
      .from("featured_posts")
      .select("*")
      .eq("auto_fetch", true)
      .not("fetch_url", "is", null);

    if (error) throw error;
    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ refreshed: 0, message: "No auto-fetch posts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group by fetch_url to avoid hitting same source repeatedly
    const urlGroups = new Map<string, typeof posts>();
    posts.forEach((p) => {
      const url = p.fetch_url!;
      if (!urlGroups.has(url)) urlGroups.set(url, []);
      urlGroups.get(url)!.push(p);
    });

    let totalRefreshed = 0;
    const fetchMetaUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fetch-metadata`;

    for (const [fetchUrl, group] of urlGroups) {
      try {
        // Determine mode: rss for .xml/rss, otherwise category
        const mode = /rss|\.xml/i.test(fetchUrl) ? "rss" : "category";
        const resp = await fetch(fetchMetaUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ url: fetchUrl, mode }),
        });
        if (!resp.ok) continue;
        const data = await resp.json();
        const items = (data.items || []).slice(0, group.length);
        if (items.length === 0) continue;

        // Update existing posts in this group with fresh data
        for (let i = 0; i < group.length && i < items.length; i++) {
          const post = group[i];
          const item = items[i];
          await supabase.from("featured_posts").update({
            title: item.title || post.title,
            url: item.url || post.url,
            image_url: item.image || post.image_url,
            description: item.description || post.description,
            updated_at: new Date().toISOString(),
          }).eq("id", post.id);
          totalRefreshed++;
        }
      } catch (e) {
        console.error(`Failed to refresh ${fetchUrl}:`, e);
      }
    }

    return new Response(JSON.stringify({ refreshed: totalRefreshed, groups: urlGroups.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
