import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddLinkDialog from "./AddLinkDialog";
import type { Category } from "./CategorySidebar";

interface SutraHeaderProps {
  categories: Category[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddLink: (link: { url: string; title: string; category: string }) => void;
  totalLinks: number;
}

const SutraHeader = ({ categories, searchQuery, onSearchChange, onAddLink, totalLinks }: SutraHeaderProps) => {
  return (
    <header className="border-b border-border bg-card">
      <div className="container flex items-center justify-between py-4 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <h1 className="font-display text-2xl text-foreground">সূত্র</h1>
          <span className="font-meta text-muted-foreground hidden sm:inline">
            {totalLinks.toLocaleString("bn-BD")} টি সাইট
          </span>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="সাইট খুঁজুন..."
            className="pl-9 text-sm bg-background"
          />
        </div>

        <AddLinkDialog categories={categories} onAdd={onAddLink} />
      </div>
    </header>
  );
};

export default SutraHeader;
