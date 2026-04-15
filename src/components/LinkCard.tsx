import { motion } from "framer-motion";
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

  const logoUrl = link.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const hasCustomLogo = !!link.favicon;

  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.01, 0.3) }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="group flex items-center gap-2 p-2 bg-card border border-border/50 hover:border-primary/40 hover:shadow-md transition-all duration-200 rounded-lg"
    >
      <div className={`${hasCustomLogo ? 'w-10 h-7' : 'w-7 h-7'} flex items-center justify-center flex-shrink-0 rounded overflow-hidden bg-white`}>
        <img
          src={logoUrl}
          alt={link.title}
          className={`${hasCustomLogo ? 'max-w-full max-h-full object-contain' : 'w-5 h-5 object-contain'}`}
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (!img.src.includes('google.com/s2/favicons')) {
              img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } else {
              img.style.display = "none";
              img.parentElement!.innerHTML = `<span class="text-xs font-bold text-muted-foreground">${link.title.charAt(0)}</span>`;
            }
          }}
        />
      </div>
      <span className="text-[11px] font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 leading-tight flex-1 min-w-0">
        {link.title}
      </span>
    </motion.a>
  );
};

export default LinkCard;
