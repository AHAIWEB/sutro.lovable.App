import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

// Multiple UA strategies to try
const UA_STRATEGIES = [
  {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "bn-BD,bn;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
  },
  {
    "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  },
  {
    "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  },
  {
    "User-Agent": "Twitterbot/1.0",
  },
];

async function fetchWithRetries(url: string): Promise<Response> {
  let lastResponse: Response | null = null;

  for (const headers of UA_STRATEGIES) {
    try {
      const resp = await fetch(url, { headers, redirect: "follow" });
      if (resp.ok) return resp;
      lastResponse = resp;
    } catch {
      // continue to next strategy
    }
  }

  // If all failed, try Google's web cache
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
    const resp = await fetch(cacheUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" },
      redirect: "follow",
    });
    if (resp.ok) return resp;
  } catch {
    // ignore
  }

  if (lastResponse) return lastResponse;
  throw new Error("All fetch attempts failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, mode } = body;
    
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let response: Response;
    try {
      response = await fetchWithRetries(url);
    } catch (e: any) {
      // Return a graceful fallback instead of 500
      const domain = new URL(url).hostname.replace("www.", "");
      const fallback = {
        title: domain,
        image: null,
        description: null,
        site_name: domain,
        warning: `Could not fetch: site may block automated requests (${e.message})`,
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      // Return graceful fallback with domain name instead of crashing
      const domain = new URL(url).hostname.replace("www.", "");
      const fallback = {
        title: domain,
        image: null,
        description: null,
        site_name: domain,
        warning: `Site returned ${response.status} — may use Cloudflare or bot protection`,
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await response.text();

    if (mode === "rss") {
      const items = parseRssFeed(text);
      return new Response(JSON.stringify({ items, count: items.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "category") {
      const articles: { title: string; url: string; image: string | null; description: string | null; source: string | null }[] = [];
      const baseUrl = new URL(url);
      const seen = new Set<string>();
      const siteName = baseUrl.hostname.replace("www.", "");

      // Strategy 1: Find all <a> tags, prioritize those with article-like URLs (date patterns, /article/, numeric IDs)
      const linkRegex = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      const allLinks: { href: string; title: string; index: number; innerHtml: string; isArticle: boolean }[] = [];

      while ((m = linkRegex.exec(text)) !== null) {
        let href = m[1];
        const innerHtml = m[2];
        const title = innerHtml.replace(/<[^>]*>/g, "").trim();
        if (!title || title.length < 5) continue;
        if (href.startsWith("javascript:") || href.startsWith("mailto:")) continue;
        try {
          if (!href.startsWith("http")) href = new URL(href, url).href;
          if (new URL(href).hostname !== baseUrl.hostname) continue;
        } catch { continue; }
        if (seen.has(href)) continue;
        seen.add(href);

        // Detect article URLs by pattern: contains dates, numeric IDs, or article-like paths
        const isArticle = /\/\d{4}\/\d{1,2}\/|\/\d{5,}|\/article[s]?\/|\/news\/|\/post\/|\/story\//i.test(href);
        allLinks.push({ href, title, index: m.index, innerHtml, isArticle });
      }

      // Separate articles from nav links
      const articleLinks = allLinks.filter(l => l.isArticle);
      const navLinks = allLinks.filter(l => !l.isArticle);

      // Process article links first (these are actual posts)
      for (const link of articleLinks) {
        // Search for nearby image in surrounding HTML (1000 chars around)
        const surroundingHtml = text.substring(Math.max(0, link.index - 800), link.index + link.title.length + 800);
        const imgMatch = surroundingHtml.match(/<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+\.(?:jpg|jpeg|png|webp|gif)[^"']*)["']/i)
          || surroundingHtml.match(/<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i);
        let image = imgMatch ? imgMatch[1] : null;
        if (image && !image.startsWith("http")) {
          try { image = new URL(image, url).href; } catch { image = null; }
        }
        // Skip tiny icons/tracking pixels
        if (image && /1x1|pixel|spacer|blank|logo|icon|favicon/i.test(image)) image = null;

        // Extract description from nearby <p> tags
        const descMatch = surroundingHtml.match(/<p[^>]*>([\s\S]{20,}?)<\/p>/i);
        const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").trim().slice(0, 200) : null;

        articles.push({ title: link.title, url: link.href, image, description, source: siteName });
      }

      // If few articles found, also include nav links as category pages
      if (articles.length < 3) {
        for (const link of navLinks) {
          if (link.title.length < 10 && articles.length > 5) continue;
          const surroundingHtml = text.substring(Math.max(0, link.index - 500), link.index + link.title.length + 500);
          const imgMatch = surroundingHtml.match(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/i);
          let image = imgMatch ? imgMatch[1] : null;
          if (image && !image.startsWith("http")) {
            try { image = new URL(image, url).href; } catch { image = null; }
          }
          articles.push({ title: link.title, url: link.href, image, description: null, source: siteName });
        }
      }

      return new Response(JSON.stringify({ 
        items: articles.slice(0, 50), 
        count: articles.length, 
        source: siteName,
        article_count: articleLinks.length,
        nav_count: navLinks.length
      }), {
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
