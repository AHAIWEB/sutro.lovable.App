import { cn } from "@/lib/utils";
import type { Category } from "./CategorySidebar";

interface MobileCategoryBarProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

const MobileCategoryBar = ({ categories, activeCategory, onSelect }: MobileCategoryBarProps) => {
  return (
    <div className="lg:hidden border-b border-border bg-card overflow-x-auto">
      <div className="flex gap-1 px-4 py-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs whitespace-nowrap transition-colors duration-200 flex-shrink-0",
              activeCategory === cat.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted"
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
