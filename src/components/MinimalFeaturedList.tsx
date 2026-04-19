import { motion } from "framer-motion";
import { ExternalLink, TrendingUp } from "lucide-react";
import { useFeaturedPosts } from "@/hooks/useCountries";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const MinimalFeaturedList = () => {
  const { data: posts = [] } = useFeaturedPosts();
  const { data: settings } = useSiteSettings();
  const count = settings?.featured_count ?? 6;
  const active = posts.filter((p) => p.is_active).slice(0, count);
  if (active.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-5 border-b border-border bg-card/30">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h2 className="font-display text-base text-foreground">ফিচারড পোস্ট</h2>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {active.map((post, i) => (
          <motion.li
            key={post.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-background/60 hover:bg-primary/5 hover:border-primary/40 transition-all"
            >
              <span className="font-meta text-[10px] text-muted-foreground w-5 flex-shrink-0">
                {(i + 1).toLocaleString("bn-BD")}.
              </span>
              <span className="flex-1 text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                {post.title}
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </motion.li>
        ))}
      </ul>
    </section>
  );
};

export default MinimalFeaturedList;
