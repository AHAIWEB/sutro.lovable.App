import { motion } from "framer-motion";
import { ArrowUpRight, Eye } from "lucide-react";
import type { LinkRow } from "@/hooks/useLinks";

interface LinkCardProps {
  link: LinkRow;
  index: number;
}

const LinkCard = ({ link, index }: LinkCardProps) => {
  const domain = (() => {
    try {
      return new URL(link.url).hostname.replace("www.", "");
    } catch {
      return link.url;
    }
  })();

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group relative flex items-center gap-3 p-3.5 bg-card border border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200 rounded-xl"
    >
      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
        <img
          src={faviconUrl}
          alt=""
          className="w-5 h-5 object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-sm font-display text-muted-foreground">${link.title.charAt(0)}</span>`;
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {link.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">{domain}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {link.visits > 0 && (
          <span className="flex items-center gap-1 text-muted-foreground/60 font-meta">
            <Eye className="w-3 h-3" />
            {link.visits > 999
              ? `${(link.visits / 1000).toFixed(1)}k`
              : link.visits}
          </span>
        )}
        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
      </div>
    </motion.a>
  );
};

export default LinkCard;
