import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Words/patterns that almost always indicate a navigation/category link, not real content.
const NAV_PATTERNS = [
  /^(home|about|contact|privacy|terms|login|signup|sign\s*in|register|menu|search|subscribe|category|categories|tag|tags|archive|sitemap|advertise|feed|rss)$/i,
  /^(হোম|হোমপেজ|মেনু|বিভাগ|ক্যাটাগরি|ট্যাগ|যোগাযোগ|আমাদের সম্পর্কে|লগইন|নিবন্ধন|সাবস্ক্রাইব|বিজ্ঞাপন|গোপনীয়তা|শর্তাবলী)$/i,
  /^(facebook|twitter|youtube|instagram|linkedin|pinterest|whatsapp|telegram|share)$/i,
  /^[«»‹›←→<>]+$/,
  /^\d+$/, // pure pagination numbers
];

const isNavLink = (title: string, href: string, baseHost: string) => {
  const t = title.trim();
  if (t.length < 4 || t.length > 200) return true;
  if (NAV_PATTERNS.some((p) => p.test(t))) return true;

  try {
    const u = new URL(href);
    const path = u.pathname.toLowerCase();
    // Category/tag/archive paths usually aren't articles
    if (/\/(category|categories|tag|tags|archive|author|page)\/?$/.test(path)) return true;
    if (/\/(category|tag|author)\//.test(path) && path.split("/").filter(Boolean).length <= 2) return true;
    // Same-host root or empty path is a nav link
    if (u.host === baseHost && (path === "/" || path === "")) return true;
  } catch {}
  return false;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, mode = "links" } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const html = await response.text();
    const baseUrl = new URL(url);
    const baseHost = baseUrl.host;

    // Parse <article> blocks first - usually contain real posts with titles + images.
    const articles: { title: string; url: string; favicon?: string; image?: string }[] = [];
    const articleRegex = /<article\b[^>]*>([\s\S]*?)<\/article>/gi;
    let aMatch;
    while ((aMatch = articleRegex.exec(html)) !== null) {
      const block = aMatch[1];
      const linkM = block.match(/<a\s[^>]*href=["']([^"']+)["'][^>]*>/i);
      const imgM = block.match(/<img\s[^>]*src=["']([^"']+)["']/i);
      const titleM =
        block.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i) ||
        block.match(/<a\s[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkM || !titleM) continue;
      let href = linkM[1];
      try {
        if (href.startsWith("/")) href = `${baseUrl.protocol}//${baseHost}${href}`;
        else if (!href.startsWith("http")) href = new URL(href, url).href;
      } catch { continue; }
      const title = titleM[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      if (!title || title.length < 8) continue;
      if (articles.some((x) => x.url === href)) continue;
      let image = imgM?.[1];
      if (image) {
        try {
          if (image.startsWith("/")) image = `${baseUrl.protocol}//${baseHost}${image}`;
          else if (!image.startsWith("http")) image = new URL(image, url).href;
        } catch { image = undefined; }
      }
      articles.push({
        title,
        url: href,
        image,
        favicon: `https://www.google.com/s2/favicons?domain=${baseHost}&sz=64`,
      });
    }

    if (articles.length >= 3) {
      return new Response(JSON.stringify({ links: articles, count: articles.length, mode: "articles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: extract <a> tags but filter out navigation/category links
    const links: { title: string; url: string; favicon?: string }[] = [];
    const linkRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      let href = match[1];
      const innerHtml = match[2];

      if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;

      try {
        if (href.startsWith("/")) href = `${baseUrl.protocol}//${baseHost}${href}`;
        else if (!href.startsWith("http")) href = new URL(href, url).href;
      } catch { continue; }

      const title = innerHtml.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      if (!title) continue;

      // Skip navigation / category links
      if (isNavLink(title, href, baseHost)) continue;
      if (links.some((l) => l.url === href)) continue;

      let favicon: string | undefined;
      try {
        favicon = `https://www.google.com/s2/favicons?domain=${new URL(href).hostname}&sz=64`;
      } catch {}

      links.push({ title, url: href, favicon });
    }

    return new Response(JSON.stringify({ links, count: links.length, mode: "links" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
