import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/hooks/useLinks";

interface MobileCategoryBarProps {
  categories: CategoryRow[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

const MobileCategoryBar = ({ categories, activeCategory, onSelect }: MobileCategoryBarProps) => {
  return (
    <div className="lg:hidden border-b border-border bg-card/80 backdrop-blur-sm overflow-x-auto sticky top-[57px] z-20">
      <div className="flex gap-1.5 px-4 py-2.5">
        <button
          onClick={() => onSelect("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 flex-shrink-0 font-medium",
            activeCategory === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted border border-border/60"
          )}
        >
          📋 সব
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 flex-shrink-0 font-medium",
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted border border-border/60"
            )}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileCategoryBar;
