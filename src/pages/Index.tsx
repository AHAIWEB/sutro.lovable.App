import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import NewsTicker from "@/components/NewsTicker";
import SutraHeader from "@/components/SutraHeader";
import CategorySidebar from "@/components/CategorySidebar";
import MobileCategoryBar from "@/components/MobileCategoryBar";
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
    ? "সব"
    : categories.find((c) => c.id === activeCategory)?.name ?? "সব";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NewsTicker />
      <SutraHeader
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalLinks={links.length}
      />
      <MobileCategoryBar
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <div className="flex flex-1">
        <CategorySidebar
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
          linkCounts={linkCounts}
          totalLinks={links.length}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-lg text-foreground">{activeCatName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredLinks.length.toLocaleString("bn-BD")} টি ফলাফল
              </p>
            </div>
          </div>

          {linksLoading || catsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : filteredLinks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-muted-foreground text-sm">কোনো লিংক পাওয়া যায়নি।</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredLinks.map((link, i) => (
                <LinkCard key={link.id} link={link} index={i} />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border py-4 text-center">
        <p className="text-xs text-muted-foreground">
          সূত্র — সব প্রয়োজনীয় লিংক, এক সূত্রে।
        </p>
      </footer>
    </div>
  );
};

export default Index;
