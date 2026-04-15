import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/hooks/useLinks";

interface LetterNavProps {
  categories: CategoryRow[];
  activeCategory: string;
  onSelect: (id: string) => void;
  linkCounts: Record<string, number>;
  totalLinks: number;
}

const LetterNav = ({ categories, activeCategory, onSelect, linkCounts, totalLinks }: LetterNavProps) => {
  const [openLetter, setOpenLetter] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Separate letter categories (id like "letter-a") from other categories
  const letterCategories = categories.filter((c) => /^letter-[a-z]$/.test(c.id));
  const otherCategories = categories.filter((c) => !/^letter-[a-z]$/.test(c.id));

  // Group non-letter categories by first letter of name_en
  const otherByLetter: Record<string, CategoryRow[]> = {};
  otherCategories.forEach((cat) => {
    const letter = (cat.name_en || cat.name).charAt(0).toUpperCase();
    if (!otherByLetter[letter]) otherByLetter[letter] = [];
    otherByLetter[letter].push(cat);
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenLetter(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build display items: either a letter-category or a group
  const displayLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  return (
    <div ref={dropdownRef} className="py-3 px-4 sm:px-6 lg:px-8 bg-card/50">
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => { onSelect("all"); setOpenLetter(null); }}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            activeCategory === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          সব ({totalLinks.toLocaleString("bn-BD")})
        </button>

        {displayLetters.map((letter) => {
          const letterCat = letterCategories.find((c) => c.name === letter);
          const otherGroup = otherByLetter[letter] || [];
          const hasLetterCat = !!letterCat;
          const hasOtherGroup = otherGroup.length > 0;

          if (!hasLetterCat && !hasOtherGroup) return null;

          const letterCount = hasLetterCat ? (linkCounts[letterCat.id] ?? 0) : 0;
          const otherCount = otherGroup.reduce((sum, c) => sum + (linkCounts[c.id] ?? 0), 0);
          const totalCount = letterCount + otherCount;

          if (totalCount === 0) return null;

          const isActive = (hasLetterCat && activeCategory === letterCat.id) ||
            otherGroup.some((c) => activeCategory === c.id);
          const isOpen = openLetter === letter;
          const hasDropdown = hasOtherGroup || (hasLetterCat && hasOtherGroup);

          return (
            <div key={letter} className="relative">
              <button
                onClick={() => {
                  if (hasLetterCat && !hasOtherGroup) {
                    onSelect(letterCat.id);
                    setOpenLetter(null);
                  } else if (!hasLetterCat && otherGroup.length === 1) {
                    onSelect(otherGroup[0].id);
                    setOpenLetter(null);
                  } else {
                    setOpenLetter(isOpen ? null : letter);
                  }
                }}
                className={cn(
                  "flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {letter}
                <span className="text-[10px] opacity-70 ml-0.5">{totalCount}</span>
                {hasDropdown && (
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
                )}
              </button>

              {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg min-w-[220px] max-h-[300px] overflow-y-auto py-1">
                  {hasLetterCat && (
                    <button
                      onClick={() => { onSelect(letterCat.id); setOpenLetter(null); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors",
                        activeCategory === letterCat.id && "bg-primary/10 text-primary"
                      )}
                    >
                      <span>{letterCat.icon}</span>
                      <span className="flex-1 truncate">{letter} — সব নিউজপেপার</span>
                      <span className="text-xs text-muted-foreground">{letterCount}</span>
                    </button>
                  )}
                  {otherGroup.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { onSelect(cat.id); setOpenLetter(null); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors",
                        activeCategory === cat.id && "bg-primary/10 text-primary"
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span className="flex-1 truncate">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">{linkCounts[cat.id] ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LetterNav;
