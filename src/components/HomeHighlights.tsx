import { motion } from "framer-motion";
import { ExternalLink, TrendingUp, Sparkles } from "lucide-react";
import type { LinkRow } from "@/hooks/useLinks";

interface Props {
  title: string;
  variant: "trending" | "recent";
  links: LinkRow[];
  limit?: number;
}

const HomeHighlights = ({ title, variant, links, limit = 8 }: Props) => {
  if (links.length === 0) return null;
  const Icon = variant === "trending" ? TrendingUp : Sparkles;
  const slice = links.slice(0, limit);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${
          variant === "trending" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
        }`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <h2 className="font-display text-lg text-foreground">{title}</h2>
        <span className="font-meta text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {slice.length.toLocaleString("bn-BD")} টি
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {slice.map((link, i) => {
          let domain = "";
          try { domain = new URL(link.url).hostname.replace(/^www\./, ""); } catch {}
          const fav = link.favicon || (domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : "");
          return (
            <motion.a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="group flex items-center gap-2 p-2 rounded-lg border border-border bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-sm transition-all min-w-0"
            >
              {fav && (
                <img src={fav} alt="" className="w-6 h-6 rounded flex-shrink-0 bg-muted" loading="lazy" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {link.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{domain}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </motion.a>
          );
        })}
      </div>
    </section>
  );
};

export default HomeHighlights;
