import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/hooks/useLinks";

interface CategorySidebarProps {
  categories: CategoryRow[];
  activeCategory: string;
  onSelect: (id: string) => void;
  linkCounts: Record<string, number>;
  totalLinks: number;
}

const CategorySidebar = ({ categories, activeCategory, onSelect, linkCounts, totalLinks }: CategorySidebarProps) => {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-sidebar hidden lg:block">
      <div className="sticky top-[57px] py-6 px-3">
        <p className="font-meta text-muted-foreground mb-3 px-2">ক্যাটাগরি</p>
        <nav className="space-y-0.5">
          <button
            onClick={() => onSelect("all")}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all duration-200",
              activeCategory === "all"
                ? "bg-primary/10 text-primary font-semibold shadow-sm"
                : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2.5">
              <span>📋</span>
              <span>সব</span>
            </span>
            <span className="font-meta text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
              {totalLinks}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-all duration-200",
                activeCategory === cat.id
                  ? "bg-primary/10 text-primary font-semibold shadow-sm"
                  : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2.5">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </span>
              <span className="font-meta text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                {linkCounts[cat.id] ?? 0}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export { type CategoryRow as Category };
export default CategorySidebar;
