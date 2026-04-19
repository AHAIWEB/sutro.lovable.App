import { useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, TrendingUp } from "lucide-react";
import { useFeaturedPosts } from "@/hooks/useCountries";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const bnFont = { fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" };

const imgFor = (post: any) => {
  let domain = "";
  try { domain = new URL(post.url).hostname; } catch {}
  const favicon = domain ? `https://www.google.com/s2/favicons?sz=256&domain=${domain}` : "/placeholder.svg";
  const shot = domain ? `https://image.thum.io/get/width/1200/crop/700/${post.url}` : "";
  return post.image_url || shot || favicon;
};

const HeroSidebarFeatured = () => {
  const { data: posts = [] } = useFeaturedPosts();
  const { data: settings } = useSiteSettings();
  const count = settings?.featured_count ?? 6;

  const active = useMemo(
    () => posts.filter((p) => p.is_active).slice(0, count),
    [posts, count]
  );

  if (active.length === 0) return null;
  const [hero, ...rest] = active;

  return (
    <section className="border-b border-border bg-gradient-to-b from-card/40 to-background">
      <div className="container py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> ফিচার্ড
          </span>
          <span className="text-xs text-muted-foreground" style={bnFont}>
            {active.length.toLocaleString("bn-BD")} টি পোস্ট
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hero (left, 2/3) */}
          <motion.a
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            href={hero.url}
            target="_blank"
            rel="noopener noreferrer"
            className="lg:col-span-2 relative rounded-2xl overflow-hidden ring-1 ring-border shadow-lg group aspect-[16/10] bg-muted"
            style={bnFont}
          >
            <img
              src={imgFor(hero)}
              alt={hero.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.fb) { img.dataset.fb = "1"; img.src = "/placeholder.svg"; }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white">
              {hero.source_name && (
                <span className="inline-block text-[10px] uppercase tracking-wider font-bold bg-primary/90 backdrop-blur px-2.5 py-1 rounded-full mb-2">
                  {hero.source_name}
                </span>
              )}
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight line-clamp-3 drop-shadow-lg" style={bnFont}>
                {hero.title}
              </h2>
              {hero.description && (
                <p className="text-xs sm:text-sm text-white/85 mt-2 line-clamp-2 hidden sm:block" style={bnFont}>
                  {hero.description}
                </p>
              )}
            </div>
          </motion.a>

          {/* Sidebar list (right, 1/3) */}
          <div className="lg:col-span-1 rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-border bg-muted/40">
              <h3 className="font-display text-sm text-foreground" style={bnFont}>আরও পড়ুন</h3>
            </div>
            <ul className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
              {rest.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-2.5 p-2.5 hover:bg-primary/5 transition-colors group"
                    style={bnFont}
                  >
                    <img
                      src={imgFor(p)}
                      alt=""
                      loading="lazy"
                      className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-muted"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fb) { img.dataset.fb = "1"; img.src = "/placeholder.svg"; }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug" style={bnFont}>
                        {p.title}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                        {p.source_name || "পড়ুন"} <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </a>
                </motion.li>
              ))}
              {rest.length === 0 && (
                <li className="p-4 text-center text-xs text-muted-foreground" style={bnFont}>
                  আরও পোস্ট নেই
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSidebarFeatured;
