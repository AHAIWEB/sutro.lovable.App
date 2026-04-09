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

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const LetterNav = ({ categories, activeCategory, onSelect, linkCounts, totalLinks }: LetterNavProps) => {
  const [openLetter, setOpenLetter] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Group categories by first letter of name
  const letterGroups: Record<string, CategoryRow[]> = {};
  categories.forEach((cat) => {
    const letter = cat.name.charAt(0).toUpperCase();
    if (!letterGroups[letter]) letterGroups[letter] = [];
    letterGroups[letter].push(cat);
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenLetter(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeCat = categories.find((c) => c.id === activeCategory);
  const activeLetter = activeCat ? activeCat.name.charAt(0).toUpperCase() : null;

  return (
    <div ref={dropdownRef} className="py-4 px-4 sm:px-6 lg:px-8">
      {/* All button + Letter buttons row */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => { onSelect("all"); setOpenLetter(null); }}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            activeCategory === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          সব ({totalLinks})
        </button>

        {LETTERS.map((letter) => {
          const group = letterGroups[letter];
          if (!group || group.length === 0) return null;

          const letterCount = group.reduce((sum, c) => sum + (linkCounts[c.id] ?? 0), 0);
          if (letterCount === 0 && activeCategory !== "all") return null;

          const isActive = activeLetter === letter;
          const isOpen = openLetter === letter;

          return (
            <div key={letter} className="relative">
              <button
                onClick={() => {
                  if (group.length === 1) {
                    onSelect(group[0].id);
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
                {group.length > 1 && (
                  <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
                )}
              </button>

              {/* Dropdown */}
              {isOpen && group.length > 1 && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg min-w-[200px] max-h-[300px] overflow-y-auto py-1">
                  {group.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSelect(cat.id);
                        setOpenLetter(null);
                      }}
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
