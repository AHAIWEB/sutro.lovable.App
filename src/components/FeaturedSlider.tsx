import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useFeaturedPosts } from "@/hooks/useCountries";

const FeaturedSlider = () => {
  const { data: posts = [] } = useFeaturedPosts();
  const [current, setCurrent] = useState(0);

  const activePosts = posts.filter((p) => p.is_active);

  useEffect(() => {
    if (activePosts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activePosts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activePosts.length]);

  if (activePosts.length === 0) return null;

  const post = activePosts[current];

  return (
    <div className="relative bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 border-b border-border overflow-hidden">
      <div className="container py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            🔥 শীর্ষ খবর
          </span>
          <span className="font-meta text-muted-foreground" style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
            {activePosts.length > 1 && `${(current + 1).toLocaleString("bn-BD")} / ${activePosts.length.toLocaleString("bn-BD")}`}
          </span>
        </div>

        <div className="relative min-h-[120px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
            >
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4"
                style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}
              >
                {(() => {
                  const domain = (() => {
                    try { return new URL(post.url).hostname; } catch { return ""; }
                  })();
                  const faviconLg = domain ? `https://www.google.com/s2/favicons?sz=256&domain=${domain}` : "/placeholder.svg";
                  const screenshot = domain ? `https://image.thum.io/get/width/600/crop/400/${post.url}` : "";
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
                      className="w-28 h-24 sm:w-32 sm:h-24 rounded-xl object-cover flex-shrink-0 bg-muted ring-1 ring-border shadow-md group-hover:scale-[1.02] transition-transform"
                    />
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug"
                      style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2"
                       style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}>
                      {post.description}
                    </p>
                  )}
                  {post.source_name && (
                    <span className="text-xs text-primary/80 mt-1.5 inline-flex items-center gap-1 font-medium">
                      {post.source_name} <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </a>
            </motion.div>
          </AnimatePresence>
        </div>

        {activePosts.length > 1 && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1.5">
              {activePosts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-8 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrent((current - 1 + activePosts.length) % activePosts.length)}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setCurrent((current + 1) % activePosts.length)}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedSlider;
