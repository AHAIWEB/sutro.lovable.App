import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SutraBot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract links from HTML
    const links: { title: string; url: string; favicon?: string }[] = [];
    const baseUrl = new URL(url);

    // Match <a> tags with href
    const linkRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      const innerHtml = match[2];

      // Skip internal/anchor/javascript links
      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) continue;

      // Resolve relative URLs
      try {
        if (href.startsWith("/")) {
          href = `${baseUrl.protocol}//${baseUrl.host}${href}`;
        } else if (!href.startsWith("http")) {
          href = new URL(href, url).href;
        }
      } catch {
        continue;
      }

      // Extract text content (strip HTML tags)
      const title = innerHtml.replace(/<[^>]*>/g, "").trim();
      if (!title || title.length < 2) continue;

      // Skip duplicate URLs
      if (links.some((l) => l.url === href)) continue;

      // Try to extract domain for favicon
      let favicon: string | undefined;
      try {
        const domain = new URL(href).hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      } catch {}

      links.push({ title, url: href, favicon });
    }

    return new Response(JSON.stringify({ links, count: links.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
