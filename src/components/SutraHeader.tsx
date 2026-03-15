import { Search, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddLinkDialog from "./AddLinkDialog";
import type { CategoryRow } from "@/hooks/useLinks";

interface SutraHeaderProps {
  categories: CategoryRow[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalLinks: number;
}

const SutraHeader = ({ categories, searchQuery, onSearchChange, totalLinks }: SutraHeaderProps) => {
  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-30">
      <div className="container flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl text-foreground leading-none">সূত্র</h1>
            <span className="font-meta text-muted-foreground hidden sm:block">
              {totalLinks.toLocaleString("bn-BD")} টি সাইট
            </span>
          </div>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="সাইট খুঁজুন..."
            className="pl-9 text-sm bg-background/60 border-border/60 focus:bg-background transition-colors"
          />
        </div>

        <AddLinkDialog categories={categories} />
      </div>
    </header>
  );
};

export default SutraHeader;
