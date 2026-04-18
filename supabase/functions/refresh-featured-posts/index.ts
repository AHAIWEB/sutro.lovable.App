import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Junk filter — same rules used during cleanup
const JUNK_REGEX =
  /(login|sign\s*in|sign\s*up|register|click\s*here|read\s*more|learn\s*more|see\s*more|view\s*more|home|about|contact|privacy|terms|category|categories|menu|navigation|footer|header|next|previous|prev|back|skip|cookie|subscribe|newsletter|advertis|ক্যাটাগরি|মেনু|লগইন|আরও\s*পড়ুন|হোম|যোগাযোগ|সাবস্ক্রাইব)/i;

const isJunk = (title: string) => {
  const t = (title || "").trim();
  if (t.length < 15) return true;
  return JUNK_REGEX.test(t);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: posts, error } = await supabase
      .from("featured_posts")
      .select("*")
      .eq("auto_fetch", true)
      .not("fetch_url", "is", null);

    if (error) throw error;
    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ refreshed: 0, deleted: 0, message: "No auto-fetch posts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const urlGroups = new Map<string, typeof posts>();
    posts.forEach((p) => {
      const url = p.fetch_url!;
      if (!urlGroups.has(url)) urlGroups.set(url, []);
      urlGroups.get(url)!.push(p);
    });

    let totalRefreshed = 0;
    let totalDeleted = 0;
    const fetchMetaUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fetch-metadata`;

    for (const [fetchUrl, group] of urlGroups) {
      try {
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
        // Filter out junk items BEFORE matching to slots
        const cleanItems = (data.items || []).filter((it: any) => !isJunk(it.title || ""));
        if (cleanItems.length === 0) continue;
        const items = cleanItems.slice(0, group.length);

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

    // Final sweep: delete any junk that remains
    const { data: junkRows } = await supabase
      .from("featured_posts")
      .select("id, title")
      .eq("auto_fetch", true);

    const junkIds = (junkRows || []).filter((r) => isJunk(r.title)).map((r) => r.id);
    if (junkIds.length > 0) {
      await supabase.from("featured_posts").delete().in("id", junkIds);
      totalDeleted = junkIds.length;
    }

    return new Response(JSON.stringify({ refreshed: totalRefreshed, deleted: totalDeleted, groups: urlGroups.size }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
