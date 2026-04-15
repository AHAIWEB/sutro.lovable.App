import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LinkCard from "./LinkCard";
import type { LinkRow, CategoryRow } from "@/hooks/useLinks";
import type { CountryRow, SubCategoryRow } from "@/hooks/useCountries";

interface CountrySectionProps {
  country: CountryRow;
  links: LinkRow[];
  categories: CategoryRow[];
  subCategories: SubCategoryRow[];
}

const CountrySection = ({ country, links, categories, subCategories }: CountrySectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const [activeSubCat, setActiveSubCat] = useState<string>("all");

  const countryLinks = useMemo(
    () => links.filter((l) => l.country_id === country.id),
    [links, country.id]
  );

  const groupedBySub = useMemo(() => {
    const groups: Record<string, LinkRow[]> = {};
    countryLinks.forEach((l) => {
      const key = l.sub_category_id || "uncategorized";
      if (!groups[key]) groups[key] = [];
      groups[key].push(l);
    });
    return groups;
  }, [countryLinks]);

  const displayLinks = activeSubCat === "all"
    ? countryLinks
    : countryLinks.filter((l) => (l.sub_category_id || "uncategorized") === activeSubCat);

  if (countryLinks.length === 0) return null;

  const activeSubCategories = subCategories.filter((sc) => groupedBySub[sc.id]?.length > 0);

  return (
    <section className="border border-border rounded-xl overflow-hidden bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{country.flag}</span>
          <h2 className="font-display text-base text-foreground">{country.name}</h2>
          <span className="font-meta text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {countryLinks.length.toLocaleString("bn-BD")} টি
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {activeSubCategories.length > 0 && (
              <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b border-border/60 bg-background/50">
                <button
                  onClick={() => setActiveSubCat("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    activeSubCat === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  সব ({countryLinks.length.toLocaleString("bn-BD")})
                </button>
                {activeSubCategories.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveSubCat(sc.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                      activeSubCat === sc.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{sc.icon}</span>
                    {sc.name}
                    <span className="opacity-70">({(groupedBySub[sc.id]?.length || 0).toLocaleString("bn-BD")})</span>
                  </button>
                ))}
                {groupedBySub["uncategorized"]?.length > 0 && (
                  <button
                    onClick={() => setActiveSubCat("uncategorized")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeSubCat === "uncategorized"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    অন্যান্য ({groupedBySub["uncategorized"].length.toLocaleString("bn-BD")})
                  </button>
                )}
              </div>
            )}

            <div className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {displayLinks.map((link, i) => (
                  <LinkCard key={link.id} link={link} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CountrySection;
