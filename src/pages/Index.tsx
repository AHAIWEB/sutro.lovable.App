import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import NewsTicker from "@/components/NewsTicker";
import SutraHeader from "@/components/SutraHeader";
import CountryDropdownNav from "@/components/CountryDropdownNav";
import CountrySection from "@/components/CountrySection";
import FeaturedSlider from "@/components/FeaturedSlider";
import LinkCard from "@/components/LinkCard";
import { useCategories, useLinks } from "@/hooks/useLinks";
import { useCountries, useSubCategories, CONTINENT_LABELS, CONTINENT_ORDER } from "@/hooks/useCountries";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [activeCountry, setActiveCountry] = useState("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: links = [], isLoading: linksLoading } = useLinks();
  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const { data: subCategories = [] } = useSubCategories();

  const linkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach((l) => {
      counts[l.category_id] = (counts[l.category_id] ?? 0) + 1;
    });
    return counts;
  }, [links]);

  const countryLinkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach((l) => {
      if (l.country_id) counts[l.country_id] = (counts[l.country_id] ?? 0) + 1;
    });
    return counts;
  }, [links]);

  const filteredLinks = useMemo(() => {
    let result = links;
    if (activeCountry !== "all") {
      result = result.filter((l) => l.country_id === activeCountry);
    }
    if (activeCategory !== "all") {
      const isSub = subCategories.some((sc) => sc.id === activeCategory);
      if (isSub) {
        result = result.filter((l) => l.sub_category_id === activeCategory);
      } else {
        result = result.filter((l) => l.category_id === activeCategory);
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => b.visits - a.visits);
  }, [links, activeCountry, activeCategory, searchQuery, subCategories]);

  // Countries that have links with country_id set
  const countriesByContinent = useMemo(() => {
    const active = countries.filter((c) => (countryLinkCounts[c.id] ?? 0) > 0);
    const grouped: Record<string, typeof active> = {};
    active.forEach((c) => {
      const cont = c.continent || "other";
      if (!grouped[cont]) grouped[cont] = [];
      grouped[cont].push(c);
    });
    return grouped;
  }, [countries, countryLinkCounts]);

  const isLoading = linksLoading || catsLoading || countriesLoading;

  const showCountryView = activeCountry === "all" && activeCategory === "all" && !searchQuery.trim();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NewsTicker />
      <SutraHeader
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalLinks={links.length}
      />

      <FeaturedSlider />

      {!isLoading && (
        <CountryDropdownNav
          countries={countries}
          categories={categories}
          subCategories={subCategories}
          activeCountry={activeCountry}
          activeCategory={activeCategory}
          onSelectCountry={setActiveCountry}
          onSelectCategory={setActiveCategory}
          linkCounts={linkCounts}
          countryLinkCounts={countryLinkCounts}
          totalLinks={links.length}
        />
      )}

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : showCountryView ? (
          <div className="space-y-6">
            {/* Country sections with logo grid */}
            {CONTINENT_ORDER.filter(cont => countriesByContinent[cont]?.length > 0).map((cont) => (
              <div key={cont} className="space-y-3">
                <h2 className="font-display text-lg text-foreground px-1">{CONTINENT_LABELS[cont] || cont}</h2>
                {countriesByContinent[cont].map((country) => (
                  <CountrySection
                    key={country.id}
                    country={country}
                    links={links}
                    categories={categories}
                    subCategories={subCategories}
                  />
                ))}
              </div>
            ))}
              .map((cat) => {
                const catLinks = links.filter((l) => l.category_id === cat.id && !l.country_id);
                return (
                  <section key={cat.id} className="border border-border rounded-xl overflow-hidden bg-card">
                    <button
                      onClick={() => { setActiveCountry("all"); setActiveCategory(cat.id); }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <h3 className="font-display text-base text-foreground">{cat.name}</h3>
                        <span className="font-meta text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {catLinks.length.toLocaleString("bn-BD")} টি
                        </span>
                      </div>
                      <span className="font-meta text-primary">সব দেখুন →</span>
                    </button>
                    <div className="p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                        {catLinks.slice(0, 16).map((link, i) => (
                          <LinkCard key={link.id} link={link} index={i} />
                        ))}
                      </div>
                    </div>
                  </section>
                );
              })}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-5">
              {activeCountry !== "all" && (
                <span className="text-lg">
                  {countries.find((c) => c.id === activeCountry)?.flag || "🏳️"}
                </span>
              )}
              <h2 className="font-display text-lg text-foreground">
                {activeCountry !== "all"
                  ? countries.find((c) => c.id === activeCountry)?.name
                  : activeCategory !== "all"
                    ? (subCategories.find((sc) => sc.id === activeCategory)?.name ||
                       categories.find((c) => c.id === activeCategory)?.name || "সব সাইট")
                    : "সব সাইট"}
              </h2>
              <span className="font-meta text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {filteredLinks.length.toLocaleString("bn-BD")} টি
              </span>
              {(activeCountry !== "all" || activeCategory !== "all") && (
                <button
                  onClick={() => { setActiveCountry("all"); setActiveCategory("all"); }}
                  className="ml-auto font-meta text-primary hover:underline"
                >
                  ← সব দেখুন
                </button>
              )}
            </div>

            {filteredLinks.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-muted-foreground text-sm">কোনো লিংক পাওয়া যায়নি।</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                {filteredLinks.map((link, i) => (
                  <LinkCard key={link.id} link={link} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          সূত্র — সব প্রয়োজনীয় লিংক, এক সূত্রে।
        </p>
      </footer>
    </div>
  );
};

export default Index;
