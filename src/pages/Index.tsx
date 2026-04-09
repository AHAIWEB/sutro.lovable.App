import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import NewsTicker from "@/components/NewsTicker";
import SutraHeader from "@/components/SutraHeader";
import LetterNav from "@/components/LetterNav";
import LinkCard from "@/components/LinkCard";
import { useCategories, useLinks } from "@/hooks/useLinks";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading: catsLoading } = useCategories();
  const { data: links = [], isLoading: linksLoading } = useLinks();

  const linkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    links.forEach((l) => {
      counts[l.category_id] = (counts[l.category_id] ?? 0) + 1;
    });
    return counts;
  }, [links]);

  const filteredLinks = useMemo(() => {
    let result = links;
    if (activeCategory !== "all") {
      result = result.filter((l) => l.category_id === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => b.visits - a.visits);
  }, [links, activeCategory, searchQuery]);

  const activeCatName = activeCategory === "all"
    ? "সব সাইট"
    : categories.find((c) => c.id === activeCategory)?.name ?? "সব সাইট";

  const activeCatIcon = activeCategory === "all"
    ? "📋"
    : categories.find((c) => c.id === activeCategory)?.icon ?? "📋";

  // Group links by category when showing "all"
  const groupedLinks = useMemo(() => {
    if (activeCategory !== "all" || searchQuery.trim()) return null;
    const groups: Record<string, typeof links> = {};
    filteredLinks.forEach((link) => {
      if (!groups[link.category_id]) groups[link.category_id] = [];
      groups[link.category_id].push(link);
    });
    return groups;
  }, [filteredLinks, activeCategory, searchQuery]);

  const isLoading = linksLoading || catsLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NewsTicker />
      <SutraHeader
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalLinks={links.length}
      />

      {/* Letter-based Navigation */}
      {!isLoading && (
        <LetterNav
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          linkCounts={linkCounts}
          totalLinks={links.length}
        />
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Links Section */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : groupedLinks && !searchQuery.trim() ? (
          /* Grouped by category view */
          <div className="space-y-8">
            {categories
              .filter((cat) => groupedLinks[cat.id]?.length)
              .map((cat) => (
                <section key={cat.id}>
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setActiveCategory(cat.id)}
                      className="flex items-center gap-2 group"
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <h3 className="font-display text-base text-foreground group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      <span className="font-meta text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {groupedLinks[cat.id].length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveCategory(cat.id)}
                      className="font-meta text-primary hover:underline"
                    >
                      সব দেখুন →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {groupedLinks[cat.id].slice(0, 8).map((link, i) => (
                      <LinkCard key={link.id} link={link} index={i} />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        ) : (
          /* Filtered single-category or search view */
          <>
            <div className="flex items-center gap-2 mb-5">
              <span className="text-lg">{activeCatIcon}</span>
              <h2 className="font-display text-lg text-foreground">{activeCatName}</h2>
              <span className="font-meta text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {filteredLinks.length.toLocaleString("bn-BD")} টি
              </span>
              {activeCategory !== "all" && (
                <button
                  onClick={() => setActiveCategory("all")}
                  className="ml-auto font-meta text-primary hover:underline"
                >
                  ← সব দেখুন
                </button>
              )}
            </div>
            {filteredLinks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-muted-foreground text-sm">কোনো লিংক পাওয়া যায়নি।</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
