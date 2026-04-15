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

  // Use favicon from DB if available (logo image), otherwise Google favicon
  const logoUrl = link.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const hasCustomLogo = !!link.favicon;

  return (
    <motion.a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.5) }}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="group flex flex-col items-center gap-2 p-3 bg-card border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all duration-200 rounded-xl text-center"
    >
      <div className={`${hasCustomLogo ? 'w-full h-16' : 'w-12 h-12'} flex items-center justify-center flex-shrink-0 rounded-lg overflow-hidden bg-white`}>
        <img
          src={logoUrl}
          alt={link.title}
          className={`${hasCustomLogo ? 'max-w-full max-h-full object-contain p-1' : 'w-8 h-8 object-contain'}`}
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            // Fallback to Google favicon
            if (!img.src.includes('google.com/s2/favicons')) {
              img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } else {
              img.style.display = "none";
              img.parentElement!.innerHTML = `<span class="text-lg font-bold text-muted-foreground">${link.title.charAt(0)}</span>`;
            }
          }}
        />
      </div>
      <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
        {link.title}
      </span>
    </motion.a>
  );
};

export default LinkCard;
