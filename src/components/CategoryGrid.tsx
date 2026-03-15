import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/hooks/useLinks";

interface CategoryGridProps {
  categories: CategoryRow[];
  activeCategory: string;
  onSelect: (id: string) => void;
  linkCounts: Record<string, number>;
  totalLinks: number;
}

const CategoryGrid = ({ categories, activeCategory, onSelect, linkCounts, totalLinks }: CategoryGridProps) => {
  return (
    <section className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-display text-base text-foreground">ক্যাটাগরি</h2>
        <span className="font-meta text-muted-foreground">({categories.length})</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {/* All button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onSelect("all")}
          className={cn(
            "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all duration-200 text-center",
            activeCategory === "all"
              ? "bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20"
              : "bg-card border-border/60 hover:border-primary/20 hover:bg-muted/40"
          )}
        >
          <span className="text-xl sm:text-2xl">📋</span>
          <span className={cn(
            "text-xs font-medium leading-tight",
            activeCategory === "all" ? "text-primary" : "text-foreground/80"
          )}>
            সব
          </span>
          <span className={cn(
            "font-meta px-1.5 py-0.5 rounded-full",
            activeCategory === "all"
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          )}>
            {totalLinks}
          </span>
        </motion.button>

        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl border transition-all duration-200 text-center",
              activeCategory === cat.id
                ? "bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20"
                : "bg-card border-border/60 hover:border-primary/20 hover:bg-muted/40"
            )}
          >
            <span className="text-xl sm:text-2xl">{cat.icon}</span>
            <span className={cn(
              "text-xs font-medium leading-tight line-clamp-1",
              activeCategory === cat.id ? "text-primary" : "text-foreground/80"
            )}>
              {cat.name}
            </span>
            <span className={cn(
              "font-meta px-1.5 py-0.5 rounded-full",
              activeCategory === cat.id
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {linkCounts[cat.id] ?? 0}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
