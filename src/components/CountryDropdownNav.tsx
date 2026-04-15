import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryRow } from "@/hooks/useLinks";
import type { CountryRow, SubCategoryRow } from "@/hooks/useCountries";
import { CONTINENT_LABELS, CONTINENT_ORDER } from "@/hooks/useCountries";

interface CountryDropdownNavProps {
  countries: CountryRow[];
  categories: CategoryRow[];
  subCategories: SubCategoryRow[];
  activeCountry: string;
  activeCategory: string;
  onSelectCountry: (id: string) => void;
  onSelectCategory: (id: string) => void;
  linkCounts: Record<string, number>;
  countryLinkCounts: Record<string, number>;
  totalLinks: number;
}

const CountryDropdownNav = ({
  countries,
  categories,
  subCategories,
  activeCountry,
  activeCategory,
  onSelectCountry,
  onSelectCategory,
  linkCounts,
  countryLinkCounts,
  totalLinks,
}: CountryDropdownNavProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Group categories by first letter for A-Z dropdown
  const letterCategories = categories.filter((c) => /^letter-[a-z]$/.test(c.id));

  return (
    <div ref={ref} className="py-3 px-4 sm:px-6 lg:px-8 bg-card/50 border-b border-border">
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* All button */}
        <button
          onClick={() => { onSelectCountry("all"); onSelectCategory("all"); setOpenDropdown(null); }}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            activeCountry === "all" && activeCategory === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          সব ({totalLinks.toLocaleString("bn-BD")})
        </button>

        {/* Country buttons with dropdowns */}
        {countries.filter(c => (countryLinkCounts[c.id] ?? 0) > 0).map((country) => {
          const isOpen = openDropdown === `country-${country.id}`;
          const isActive = activeCountry === country.id;
          const count = countryLinkCounts[country.id] ?? 0;

          return (
            <div key={country.id} className="relative">
              <button
                onClick={() => {
                  onSelectCountry(country.id);
                  onSelectCategory("all");
                  setOpenDropdown(null);
                }}
                onContextMenu={(e) => { e.preventDefault(); setOpenDropdown(isOpen ? null : `country-${country.id}`); }}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{country.flag}</span>
                <span className="hidden sm:inline">{country.name}</span>
                <span className="text-[10px] opacity-70">{count.toLocaleString("bn-BD")}</span>
                <ChevronDown
                  className="w-3 h-3 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(isOpen ? null : `country-${country.id}`); }}
                />
              </button>

              {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl shadow-lg min-w-[200px] max-h-[300px] overflow-y-auto py-1">
                  {subCategories.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        onSelectCountry(country.id);
                        onSelectCategory(sc.id);
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors"
                    >
                      <span>{sc.icon}</span>
                      <span className="flex-1 truncate">{sc.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1" />

        {/* A-Z letter nav for newspaper categories */}
        {letterCategories.filter(lc => (linkCounts[lc.id] ?? 0) > 0).slice(0, 10).map((lc) => {
          const letter = lc.id.replace("letter-", "").toUpperCase();
          const isActive = activeCategory === lc.id;
          return (
            <button
              key={lc.id}
              onClick={() => { onSelectCountry("all"); onSelectCategory(lc.id); setOpenDropdown(null); }}
              className={cn(
                "px-2 py-1.5 rounded-lg text-xs font-bold transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {letter}
              <span className="text-[10px] opacity-70 ml-0.5">{(linkCounts[lc.id] ?? 0)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CountryDropdownNav;
