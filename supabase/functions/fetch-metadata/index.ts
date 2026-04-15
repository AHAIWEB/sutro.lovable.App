import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract Open Graph / meta data from HTML
function extractMeta(html: string, baseUrl: string) {
  const get = (pattern: RegExp) => {
    const m = html.match(pattern);
    return m ? m[1].trim() : null;
  };

  const title =
    get(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    get(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i) ||
    get(/<title[^>]*>([^<]+)<\/title>/i) ||
    null;

  let image =
    get(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    get(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
    null;

  // Resolve relative image URLs
  if (image && !image.startsWith("http")) {
    try {
      image = new URL(image, baseUrl).href;
    } catch {}
  }

  const description =
    get(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    get(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    null;

  const siteName =
    get(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
    null;

  return { title, image, description, site_name: siteName };
}

// Parse RSS/Atom feed XML into items
function parseRssFeed(xml: string) {
  const items: { title: string; url: string; image: string | null; description: string | null; source: string | null }[] = [];

  // Try RSS 2.0 <item>
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
    const desc = block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || null;
    const img = block.match(/<enclosure[^>]+url=["']([^"']+)["']/i)?.[1] ||
                block.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1] ||
                block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ||
                block.match(/<image[^>]*>[^<]*<url>([^<]+)<\/url>/i)?.[1] ||
                null;
    const source = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i)?.[1]?.trim() || null;

    if (title && link) {
      items.push({ title, url: link, image: img, description: desc ? desc.replace(/<[^>]*>/g, "").slice(0, 200) : null, source });
    }
  }

  // Try Atom <entry>
  if (items.length === 0) {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
      const link = block.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1]?.trim() || "";
      const desc = block.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1]?.trim() ||
                   block.match(/<content[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content>/i)?.[1]?.trim() || null;
      if (title && link) {
        items.push({ title, url: link, image: null, description: desc ? desc.replace(/<[^>]*>/g, "").slice(0, 200) : null, source: null });
      }
    }
  }

  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, mode } = body; // mode: "metadata" | "rss" | "category"
    
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SutraBot/1.0)" },
      redirect: "follow",
    });

    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const text = await response.text();

    if (mode === "rss") {
      // Parse RSS/Atom
      const items = parseRssFeed(text);
      return new Response(JSON.stringify({ items, count: items.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "category") {
      // Scrape links from a news category page, extract articles with OG images
      const articles: { title: string; url: string; image: string | null; description: string | null }[] = [];
      const linkRegex = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      const baseUrl = new URL(url);
      let m;
      const seen = new Set<string>();

      while ((m = linkRegex.exec(text)) !== null) {
        let href = m[1];
        const inner = m[2].replace(/<[^>]*>/g, "").trim();
        if (!inner || inner.length < 10) continue;
        if (href.startsWith("javascript:") || href.startsWith("mailto:")) continue;

        try {
          if (!href.startsWith("http")) href = new URL(href, url).href;
        } catch { continue; }

        // Only same-domain article links
        try {
          if (new URL(href).hostname !== baseUrl.hostname) continue;
        } catch { continue; }

        if (seen.has(href)) continue;
        seen.add(href);

        // Try to find associated image
        const surroundingHtml = text.substring(Math.max(0, m.index - 500), m.index + m[0].length + 500);
        const imgMatch = surroundingHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
        let image = imgMatch ? imgMatch[1] : null;
        if (image && !image.startsWith("http")) {
          try { image = new URL(image, url).href; } catch { image = null; }
        }

        articles.push({ title: inner, url: href, image, description: null });
      }

      return new Response(JSON.stringify({ items: articles.slice(0, 30), count: articles.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: metadata extraction
    const meta = extractMeta(text, url);
    return new Response(JSON.stringify(meta), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
