import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/hooks/useLinks";

interface AllCategoriesGridProps {
  categories: CategoryRow[];
  linkCounts: Record<string, number>;
  onSelect: (id: string) => void;
}

const GRADIENTS = [
  "from-rose-500/20 via-pink-500/10 to-orange-400/20",
  "from-amber-500/20 via-yellow-400/10 to-lime-400/20",
  "from-emerald-500/20 via-teal-500/10 to-cyan-500/20",
  "from-sky-500/20 via-blue-500/10 to-indigo-500/20",
  "from-violet-500/20 via-purple-500/10 to-fuchsia-500/20",
  "from-pink-500/20 via-rose-400/10 to-red-400/20",
];

const AllCategoriesGrid = ({ categories, linkCounts, onSelect }: AllCategoriesGridProps) => {
  const mainCats = categories.filter(
    (c) => !/^letter-[a-z]$/.test(c.id) && (linkCounts[c.id] ?? 0) > 0
  );

  if (mainCats.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between px-1">
        <div>
          <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
            <span className="text-3xl">🗂️</span> সব ক্যাটাগরি
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">যেকোনো ক্যাটাগরিতে ক্লিক করে ব্রাউজ করুন</p>
        </div>
        <span className="font-meta text-foreground bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 px-3 py-1 rounded-full text-sm">
          {mainCats.length.toLocaleString("bn-BD")} টি
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {mainCats.map((c, i) => (
          <motion.button
            key={c.id}
            onClick={() => onSelect(c.id)}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.025, duration: 0.3, type: "spring", stiffness: 120 }}
            whileHover={{ y: -4, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "group relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 rounded-2xl",
              "bg-gradient-to-br border border-border/60",
              "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300",
              GRADIENTS[i % GRADIENTS.length]
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-50" />
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
            <span className="text-3xl relative z-10 group-hover:scale-110 transition-transform duration-300">{c.icon}</span>
            <span className="font-display text-sm text-foreground text-center line-clamp-2 leading-tight relative z-10">
              {c.name}
            </span>
            <span className="font-meta text-[11px] text-muted-foreground tabular-nums bg-background/60 backdrop-blur-sm px-2 py-0.5 rounded-full relative z-10">
              {(linkCounts[c.id] ?? 0).toLocaleString("bn-BD")} টি
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default AllCategoriesGrid;
