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
    <div className="relative bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border overflow-hidden">
      <div className="container py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded">
            শীর্ষ খবর
          </span>
          <span className="font-meta text-muted-foreground">
            {activePosts.length > 1 && `${(current + 1).toLocaleString("bn-BD")}/${activePosts.length.toLocaleString("bn-BD")}`}
          </span>
        </div>

        <div className="relative min-h-[60px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={post.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3"
              >
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt=""
                    className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{post.description}</p>
                  )}
                  {post.source_name && (
                    <span className="font-meta text-primary/70 mt-1 inline-flex items-center gap-1">
                      {post.source_name} <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </a>
            </motion.div>
          </AnimatePresence>
        </div>

        {activePosts.length > 1 && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              {activePosts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrent((current - 1 + activePosts.length) % activePosts.length)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setCurrent((current + 1) % activePosts.length)}
                className="p-1 rounded hover:bg-muted transition-colors"
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
