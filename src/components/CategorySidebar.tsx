import { cn } from "@/lib/utils";

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  count: number;
  icon: string;
}

interface CategorySidebarProps {
  categories: Category[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

const CategorySidebar = ({ categories, activeCategory, onSelect }: CategorySidebarProps) => {
  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card hidden lg:block">
      <div className="sticky top-0 py-6 px-4">
        <p className="font-meta text-muted-foreground mb-4 px-2">ক্যাটাগরি</p>
        <nav className="space-y-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors duration-200",
                activeCategory === cat.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </span>
              <span className="font-meta text-muted-foreground">{cat.count}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default CategorySidebar;
