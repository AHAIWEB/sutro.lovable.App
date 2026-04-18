import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Sparkles, TrendingUp } from "lucide-react";
import { useRef } from "react";

interface HomeHeroProps {
  totalLinks: number;
  totalCategories: number;
  totalCountries: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

const HomeHero = ({ totalLinks, totalCategories, totalCountries, searchQuery, onSearchChange }: HomeHeroProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-b border-border"
      style={{ fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif" }}
    >
      {/* Parallax decorative orbs */}
      <motion.div
        style={{ y: y1 }}
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl pointer-events-none"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-gradient-to-tr from-accent/25 to-primary/15 blur-3xl pointer-events-none"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.06),transparent_50%)] pointer-events-none" />

      <motion.div
        style={{ opacity }}
        className="container relative py-10 sm:py-14 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4 ring-1 ring-primary/20"
        >
          <Sparkles className="w-3.5 h-3.5" /> বাংলায় সবকিছু এক ঠিকানায়
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground mb-3 leading-tight"
        >
          সব <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">প্রয়োজনীয় লিংক</span>
          <br className="hidden sm:block" /> এক সূত্রে
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6"
        >
          সংবাদ, সরকারি সেবা, শিক্ষা, AI টুলস — হাজারো ওয়েবসাইট, এক ক্লিকে।
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative max-w-lg mx-auto"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="সাইট, ক্যাটাগরি বা কীওয়ার্ড লিখুন..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card/80 backdrop-blur-md border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-lg text-base transition-all"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6"
        >
          <Stat value={totalLinks} label="লিংক" icon={<TrendingUp className="w-3.5 h-3.5" />} />
          <span className="w-px h-6 bg-border" />
          <Stat value={totalCategories} label="ক্যাটাগরি" />
          <span className="w-px h-6 bg-border" />
          <Stat value={totalCountries} label="দেশ" />
        </motion.div>
      </motion.div>
    </section>
  );
};

const Stat = ({ value, label, icon }: { value: number; label: string; icon?: React.ReactNode }) => (
  <div className="flex items-center gap-1.5">
    {icon && <span className="text-primary">{icon}</span>}
    <span className="text-lg sm:text-xl font-bold text-foreground">{value.toLocaleString("bn-BD")}</span>
    <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
  </div>
);

export default HomeHero;
