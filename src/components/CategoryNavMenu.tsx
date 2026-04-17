import { useState, useRef, useEffect } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/hooks/useLinks";
import type { SubCategoryRow } from "@/hooks/useCountries";

interface CategoryNavMenuProps {
  categories: CategoryRow[];
  subCategories: SubCategoryRow[];
  activeCategory: string;
  onSelect: (id: string) => void;
  linkCounts: Record<string, number>;
}

const CategoryNavMenu = ({ categories, subCategories, activeCategory, onSelect, linkCounts }: CategoryNavMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Categories with at least one link, excluding letter- (handled separately)
  const mainCats = categories.filter(
    (c) => !/^letter-[a-z]$/.test(c.id) && (linkCounts[c.id] ?? 0) > 0
  );

  // Quick-access pinned cats (top 6 by link count)
  const pinned = [...mainCats].sort((a, b) => (linkCounts[b.id] ?? 0) - (linkCounts[a.id] ?? 0)).slice(0, 6);

  return (
    <div ref={ref} className="flex items-center gap-1.5 flex-wrap">
      {/* Main "All Categories" dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            open
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-accent/15 text-accent-foreground hover:bg-accent/25"
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>সব ক্যাটাগরি</span>
          <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl w-[300px] sm:w-[420px] max-h-[460px] overflow-y-auto p-2">
            <button
              onClick={() => { onSelect("all"); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted/60 font-bold mb-1 flex items-center justify-between"
            >
              <span>📋 সব দেখুন</span>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {mainCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c.id); setOpen(false); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted/60 transition-colors text-left",
                    activeCategory === c.id && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {(linkCounts[c.id] ?? 0).toLocaleString("bn-BD")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pinned quick-access category buttons */}
      {pinned.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
            activeCategory === c.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>{c.icon}</span>
          <span className="hidden md:inline">{c.name}</span>
          <span className="text-[10px] opacity-70">{(linkCounts[c.id] ?? 0).toLocaleString("bn-BD")}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryNavMenu;
