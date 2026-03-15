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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="group relative p-4 glass-card hover:border-primary/40 hover:shadow-md transition-all duration-300 rounded-xl block"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center p-2 group-hover:bg-primary/10 transition-colors">
          <img
            src={faviconUrl}
            alt=""
            className="w-6 h-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-base font-display text-muted-foreground">${link.title.charAt(0)}</span>`;
            }}
          />
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
      </div>
      <h3 className="font-semibold text-foreground text-[15px] mb-1 line-clamp-2 group-hover:text-primary transition-colors duration-200">
        {link.title}
      </h3>
      <p className="text-xs text-muted-foreground truncate mb-2">{domain}</p>
      {link.visits > 0 && (
        <div className="flex items-center gap-1 text-muted-foreground/50">
          <Eye className="w-3 h-3" />
          <span className="font-meta">{link.visits.toLocaleString("bn-BD")}</span>
        </div>
      )}
    </motion.a>
  );
};

export default LinkCard;
