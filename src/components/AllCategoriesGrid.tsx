import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/hooks/useLinks";

interface AllCategoriesGridProps {
  categories: CategoryRow[];
  linkCounts: Record<string, number>;
  onSelect: (id: string) => void;
}

const AllCategoriesGrid = ({ categories, linkCounts, onSelect }: AllCategoriesGridProps) => {
  // Exclude letter-x cats and empty cats
  const mainCats = categories.filter(
    (c) => !/^letter-[a-z]$/.test(c.id) && (linkCounts[c.id] ?? 0) > 0
  );

  if (mainCats.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-display text-lg text-foreground flex items-center gap-2">
          <span>🗂️</span> সব ক্যাটাগরি
        </h2>
        <span className="font-meta text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {mainCats.length.toLocaleString("bn-BD")} টি
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {mainCats.map((c, i) => (
          <motion.button
            key={c.id}
            onClick={() => onSelect(c.id)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.25 }}
            className={cn(
              "group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl",
              "bg-gradient-to-br from-card to-muted/40 border border-border/60",
              "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            )}
          >
            <span className="text-2xl">{c.icon}</span>
            <span className="font-display text-xs text-foreground text-center line-clamp-2 leading-tight">
              {c.name}
            </span>
            <span className="font-meta text-[10px] text-muted-foreground tabular-nums">
              {(linkCounts[c.id] ?? 0).toLocaleString("bn-BD")} টি
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default AllCategoriesGrid;
