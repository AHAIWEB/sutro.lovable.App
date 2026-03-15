import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  favicon?: string;
  visits?: number;
}

interface LinkCardProps {
  link: LinkItem;
}

const LinkCard = ({ link }: LinkCardProps) => {
  const domain = (() => {
    try {
      return new URL(link.url).hostname.replace("www.", "");
    } catch {
      return link.url;
    }
  })();

  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="group relative p-4 bg-card border border-border hover:border-primary/50 transition-colors duration-200 rounded-lg block"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-[4px] bg-muted flex items-center justify-center p-2">
          {link.favicon ? (
            <img
              src={link.favicon}
              alt=""
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-lg font-display text-muted-foreground">
              {link.title.charAt(0)}
            </span>
          )}
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
      </div>
      <h3 className="font-semibold text-foreground text-base mb-1 line-clamp-2">
        {link.title}
      </h3>
      <p className="font-meta text-muted-foreground truncate">{domain}</p>
      {link.visits !== undefined && (
        <p className="font-meta text-muted-foreground/60 mt-2">
          {link.visits.toLocaleString("bn-BD")} বার পরিদর্শন
        </p>
      )}
    </motion.a>
  );
};

export default LinkCard;
