import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Runs all active+auto_run scraper_configs whose interval has elapsed.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: configs, error } = await supabase
      .from("scraper_configs")
      .select("*")
      .eq("is_active", true)
      .eq("auto_run", true);

    if (error) throw error;
    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ ran: 0, message: "No auto-run scrapers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const scrapeUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/scrape-links`;
    let ranCount = 0;
    let importedTotal = 0;
    const results: any[] = [];

    for (const cfg of configs) {
      const interval = (cfg.run_interval_hours || 6) * 3600 * 1000;
      const lastRun = cfg.last_run_at ? new Date(cfg.last_run_at).getTime() : 0;
      if (now - lastRun < interval) continue;

      try {
        const resp = await fetch(scrapeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ url: cfg.source_url }),
        });
        if (!resp.ok) {
          results.push({ id: cfg.id, name: cfg.name, error: `HTTP ${resp.status}` });
          continue;
        }
        const data = await resp.json();
        const links = (data.links || []) as any[];
        if (links.length === 0) {
          await supabase.from("scraper_configs").update({ last_run_at: new Date().toISOString() }).eq("id", cfg.id);
          results.push({ id: cfg.id, name: cfg.name, scraped: 0 });
          continue;
        }

        // Insert with conflict skip on URL — but we don't have a unique constraint, so dedup manually.
        const urls = links.map((l) => l.url);
        const { data: existing } = await supabase
          .from("links")
          .select("url")
          .in("url", urls);
        const existingSet = new Set((existing || []).map((e) => e.url));
        const newOnes = links.filter((l) => !existingSet.has(l.url));

        if (newOnes.length > 0 && cfg.target_category_id) {
          const insertData = newOnes.map((link: any) => ({
            title: link.title,
            url: link.url,
            favicon: link.favicon || null,
            category_id: cfg.target_category_id,
            country_id: cfg.target_country_id || null,
            sub_category_id: cfg.target_sub_category_id || null,
            status: "approved" as const,
          }));
          for (let i = 0; i < insertData.length; i += 100) {
            await supabase.from("links").insert(insertData.slice(i, i + 100));
          }
          importedTotal += newOnes.length;
        }

        await supabase.from("scraper_configs").update({ last_run_at: new Date().toISOString() }).eq("id", cfg.id);
        ranCount++;
        results.push({ id: cfg.id, name: cfg.name, scraped: links.length, imported: newOnes.length });
      } catch (e: any) {
        results.push({ id: cfg.id, name: cfg.name, error: e.message });
      }
    }

    return new Response(JSON.stringify({ ran: ranCount, total_configs: configs.length, imported: importedTotal, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
