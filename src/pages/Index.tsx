import { useState, useMemo } from "react";
import NewsTicker from "@/components/NewsTicker";
import SutraHeader from "@/components/SutraHeader";
import CategorySidebar, { type Category } from "@/components/CategorySidebar";
import MobileCategoryBar from "@/components/MobileCategoryBar";
import LinkCard, { type LinkItem } from "@/components/LinkCard";

const categories: Category[] = [
  { id: "all", name: "সব", nameEn: "All", count: 0, icon: "📋" },
  { id: "govt", name: "সরকারি সেবা", nameEn: "Govt Services", count: 12, icon: "🏛️" },
  { id: "education", name: "শিক্ষা", nameEn: "Education", count: 8, icon: "📚" },
  { id: "news", name: "সংবাদ", nameEn: "News", count: 10, icon: "📰" },
  { id: "tech", name: "প্রযুক্তি", nameEn: "Technology", count: 6, icon: "💻" },
  { id: "finance", name: "অর্থ ও ব্যাংকিং", nameEn: "Finance", count: 7, icon: "🏦" },
  { id: "health", name: "স্বাস্থ্য", nameEn: "Health", count: 5, icon: "🏥" },
  { id: "ecommerce", name: "ই-কমার্স", nameEn: "E-Commerce", count: 9, icon: "🛒" },
  { id: "entertainment", name: "বিনোদন", nameEn: "Entertainment", count: 4, icon: "🎬" },
];

const initialLinks: LinkItem[] = [
  { id: "1", title: "জাতীয় তথ্য বাতায়ন", url: "https://bangladesh.gov.bd", category: "govt", visits: 45230 },
  { id: "2", title: "শিক্ষা বোর্ড ফলাফল", url: "https://educationboardresults.gov.bd", category: "education", visits: 89100 },
  { id: "3", title: "প্রথম আলো", url: "https://prothomalo.com", category: "news", visits: 120500 },
  { id: "4", title: "বাংলাদেশ ব্যাংক", url: "https://bb.org.bd", category: "finance", visits: 23400 },
  { id: "5", title: "ডেইলি স্টার বাংলা", url: "https://bangla.thedailystar.net", category: "news", visits: 67800 },
  { id: "6", title: "বিকাশ", url: "https://bkash.com", category: "finance", visits: 95600 },
  { id: "7", title: "দারাজ", url: "https://daraz.com.bd", category: "ecommerce", visits: 78200 },
  { id: "8", title: "ঢাকা বিশ্ববিদ্যালয়", url: "https://du.ac.bd", category: "education", visits: 34500 },
  { id: "9", title: "স্বাস্থ্য অধিদপ্তর", url: "https://dghs.gov.bd", category: "health", visits: 19800 },
  { id: "10", title: "বাংলাদেশ টেলিভিশন", url: "https://btv.gov.bd", category: "entertainment", visits: 12300 },
  { id: "11", title: "একাত্তর টিভি", url: "https://71tv.news", category: "news", visits: 45600 },
  { id: "12", title: "চালডাল", url: "https://chaldal.com", category: "ecommerce", visits: 56700 },
  { id: "13", title: "জাতীয় বিশ্ববিদ্যালয়", url: "https://nu.ac.bd", category: "education", visits: 41200 },
  { id: "14", title: "রবি", url: "https://robi.com.bd", category: "tech", visits: 33400 },
  { id: "15", title: "গ্রামীণফোন", url: "https://grameenphone.com", category: "tech", visits: 87900 },
  { id: "16", title: "ই-পাসপোর্ট", url: "https://epassport.gov.bd", category: "govt", visits: 67200 },
  { id: "17", title: "জাতীয় পরিচয়পত্র", url: "https://nidw.gov.bd", category: "govt", visits: 93400 },
  { id: "18", title: "ইসলামী ব্যাংক", url: "https://islamibankbd.com", category: "finance", visits: 28700 },
  { id: "19", title: "এভারকেয়ার হসপিটাল", url: "https://evercarebd.com", category: "health", visits: 15600 },
  { id: "20", title: "পিকাবু", url: "https://pikaboo.com.bd", category: "ecommerce", visits: 22100 },
  { id: "21", title: "টেকশহর", url: "https://techshohor.com", category: "tech", visits: 18900 },
  { id: "22", title: "সমকাল", url: "https://samakal.com", category: "news", visits: 54300 },
  { id: "23", title: "বাংলাদেশ সেনাবাহিনী", url: "https://army.mil.bd", category: "govt", visits: 11200 },
  { id: "24", title: "স্কয়ার হসপিটাল", url: "https://squarehospital.com", category: "health", visits: 27800 },
];

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [links, setLinks] = useState<LinkItem[]>(initialLinks);

  const categoriesWithCounts = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      count: cat.id === "all" ? links.length : links.filter((l) => l.category === cat.id).length,
    }));
  }, [links]);

  const filteredLinks = useMemo(() => {
    let result = links;
    if (activeCategory !== "all") {
      result = result.filter((l) => l.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.url.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (b.visits ?? 0) - (a.visits ?? 0));
  }, [links, activeCategory, searchQuery]);

  const handleAddLink = (data: { url: string; title: string; category: string }) => {
    const newLink: LinkItem = {
      id: Date.now().toString(),
      title: data.title,
      url: data.url,
      category: data.category,
      visits: 0,
    };
    setLinks((prev) => [newLink, ...prev]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NewsTicker />
      <SutraHeader
        categories={categoriesWithCounts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddLink={handleAddLink}
        totalLinks={links.length}
      />
      <MobileCategoryBar
        categories={categoriesWithCounts}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <div className="flex flex-1">
        <CategorySidebar
          categories={categoriesWithCounts}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-lg text-foreground">
                {categoriesWithCounts.find((c) => c.id === activeCategory)?.name ?? "সব"}
              </h2>
              <p className="font-meta text-muted-foreground mt-1">
                {filteredLinks.length.toLocaleString("bn-BD")} টি ফলাফল
              </p>
            </div>
          </div>

          {filteredLinks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm">কোনো লিংক পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredLinks.map((link) => (
                <LinkCard key={link.id} link={link} />
              ))}
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border py-4 text-center">
        <p className="font-meta text-muted-foreground">
          সূত্র — সব প্রয়োজনীয় লিংক, এক সূত্রে।
        </p>
      </footer>
    </div>
  );
};

export default Index;
