import { motion } from "framer-motion";
import { ExternalLink, TrendingUp } from "lucide-react";
import { useFeaturedPosts } from "@/hooks/useCountries";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const PostImage = ({ post, big }: { post: any; big?: boolean }) => {
  const domain = (() => {
    try { return new URL(post.url).hostname; } catch { return ""; }
  })();
  const faviconLg = domain ? `https://www.google.com/s2/favicons?sz=256&domain=${domain}` : "/placeholder.svg";
  const screenshot = domain ? `https://image.thum.io/get/width/800/crop/500/${post.url}` : "";
  const initialSrc = post.image_url || screenshot || faviconLg;

  return (
    <img
      src={initialSrc}
      alt={post.title}
      loading="lazy"
      data-fallback-stage="0"
      onError={(e) => {
        const img = e.currentTarget;
        const stage = parseInt(img.dataset.fallbackStage || "0");
        if (stage === 0 && screenshot && img.src !== screenshot) {
          img.dataset.fallbackStage = "1"; img.src = screenshot;
        } else if (stage <= 1 && img.src !== faviconLg) {
          img.dataset.fallbackStage = "2"; img.src = faviconLg;
        } else if (img.src !== window.location.origin + "/placeholder.svg") {
          img.dataset.fallbackStage = "3"; img.src = "/placeholder.svg";
        }
      }}
      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${big ? "" : ""}`}
    />
  );
};

const MagazineFeaturedGrid = () => {
  const { data: posts = [] } = useFeaturedPosts();
  const { data: settings } = useSiteSettings();
  const count = settings?.featured_count ?? 6;

  const active = posts.filter((p) => p.is_active).slice(0, count);
  if (active.length === 0) return null;

  const hero = active[0];
  const rest = active.slice(1);

  const bnFont = { fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" };

  return (
    <section className="bg-gradient-to-b from-card/30 via-background to-background border-b border-border">
      <div className="container py-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> ফিচার্ড পোস্ট
          </span>
          <span className="text-xs text-muted-foreground" style={bnFont}>
            {active.length.toLocaleString("bn-BD")} টি গল্প
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 md:auto-rows-[180px]">
          {/* HERO — big card */}
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            href={hero.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden shadow-lg ring-1 ring-border bg-muted min-h-[280px] md:min-h-0"
            style={bnFont}
          >
            <PostImage post={hero} big />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 text-white">
              {hero.source_name && (
                <span className="inline-block text-[10px] uppercase tracking-wider font-bold bg-primary/90 px-2 py-0.5 rounded mb-2">
                  {hero.source_name}
                </span>
              )}
              <h2 className="text-xl md:text-3xl font-bold leading-tight line-clamp-3 group-hover:text-primary-foreground transition-colors" style={bnFont}>
                {hero.title}
              </h2>
              {hero.description && (
                <p className="text-xs md:text-sm text-white/80 mt-2 line-clamp-2 hidden md:block" style={bnFont}>
                  {hero.description}
                </p>
              )}
            </div>
          </motion.a>

          {/* SMALL CARDS */}
          {rest.map((post, i) => (
            <motion.a
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * (i + 1) }}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl overflow-hidden shadow-md ring-1 ring-border bg-muted min-h-[160px]"
              style={bnFont}
            >
              <PostImage post={post} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                {post.source_name && (
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wide font-bold text-primary-foreground/90 mb-1">
                    {post.source_name} <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                )}
                <h3 className="text-xs md:text-sm font-semibold leading-snug line-clamp-2" style={bnFont}>
                  {post.title}
                </h3>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MagazineFeaturedGrid;
