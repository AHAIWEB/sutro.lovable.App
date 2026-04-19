import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, TrendingUp, Pause, Play } from "lucide-react";
import { useFeaturedPosts } from "@/hooks/useCountries";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const bnFont = { fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" };

const PostImage = ({ post, className }: { post: any; className?: string }) => {
  const domain = useMemo(() => {
    try { return new URL(post.url).hostname; } catch { return ""; }
  }, [post.url]);
  const faviconLg = domain ? `https://www.google.com/s2/favicons?sz=256&domain=${domain}` : "/placeholder.svg";
  const screenshot = domain ? `https://image.thum.io/get/width/1200/crop/700/${post.url}` : "";
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
      className={className || "w-full h-full object-cover"}
    />
  );
};

const FeaturedCarousel = () => {
  const { data: posts = [] } = useFeaturedPosts();
  const { data: settings } = useSiteSettings();
  const count = settings?.featured_count ?? 6;

  const active = useMemo(
    () => posts.filter((p) => p.is_active).slice(0, count),
    [posts, count]
  );

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (active.length <= 1 || paused) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % active.length), 5500);
    return () => clearInterval(id);
  }, [active.length, paused]);

  useEffect(() => {
    if (current >= active.length) setCurrent(0);
  }, [active.length, current]);

  if (active.length === 0) return null;
  const post = active[current];

  const go = (dir: 1 | -1) =>
    setCurrent((c) => (c + dir + active.length) % active.length);

  return (
    <section className="relative bg-gradient-to-b from-card/40 via-background to-background border-b border-border">
      <div className="container py-5">
        {/* Header strip */}
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> ফিচার্ড
            </span>
            <span className="text-xs text-muted-foreground" style={bnFont}>
              {(current + 1).toLocaleString("bn-BD")} / {active.length.toLocaleString("bn-BD")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaused((p) => !p)}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label={paused ? "Play" : "Pause"}
            >
              {paused ? <Play className="w-3.5 h-3.5 text-muted-foreground" /> : <Pause className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
            <button onClick={() => go(-1)} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Previous">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => go(1)} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Next">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Big slide */}
        <div className="relative rounded-2xl overflow-hidden ring-1 ring-border shadow-lg bg-muted aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] max-h-[460px]">
          <AnimatePresence mode="wait">
            <motion.a
              key={post.id}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute inset-0 group"
              style={bnFont}
            >
              <PostImage post={post} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8 text-white">
                {post.source_name && (
                  <span className="inline-block text-[10px] sm:text-[11px] uppercase tracking-wider font-bold bg-primary/90 backdrop-blur px-2.5 py-1 rounded-full mb-2 sm:mb-3">
                    {post.source_name}
                  </span>
                )}
                <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight line-clamp-3 max-w-4xl drop-shadow-lg" style={bnFont}>
                  {post.title}
                </h2>
                {post.description && (
                  <p className="text-xs sm:text-sm md:text-base text-white/85 mt-2 line-clamp-2 max-w-3xl hidden sm:block" style={bnFont}>
                    {post.description}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 mt-2 sm:mt-3 text-[11px] sm:text-xs text-white/70">
                  পড়ুন <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </motion.a>
          </AnimatePresence>

          {/* Progress bar */}
          {!paused && active.length > 1 && (
            <motion.div
              key={`pg-${post.id}`}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5.5, ease: "linear" }}
              className="absolute top-0 left-0 h-0.5 bg-primary z-10"
            />
          )}
        </div>

        {/* Thumbnail strip */}
        {active.length > 1 && (
          <div className="mt-3 grid grid-flow-col auto-cols-[minmax(120px,1fr)] sm:auto-cols-[minmax(140px,1fr)] gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {active.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setCurrent(i)}
                className={`relative rounded-lg overflow-hidden ring-2 transition-all flex-shrink-0 aspect-[16/10] group ${
                  i === current
                    ? "ring-primary shadow-md scale-[1.02]"
                    : "ring-border/50 opacity-65 hover:opacity-100"
                }`}
                style={bnFont}
                aria-label={`Slide ${i + 1}`}
              >
                <PostImage post={p} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-1.5 text-[10px] sm:text-[11px] text-white font-semibold line-clamp-2 text-left leading-tight" style={bnFont}>
                  {p.title}
                </span>
                <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {(i + 1).toLocaleString("bn-BD")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedCarousel;
