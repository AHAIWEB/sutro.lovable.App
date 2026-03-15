import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const newsItems = [
  { id: 1, text: "বাংলাদেশ ব্যাংকের নতুন মুদ্রানীতি ঘোষণা — সুদের হার অপরিবর্তিত", category: "অর্থনীতি" },
  { id: 2, text: "ঢাকা মেট্রোরেলের নতুন রুট চালু হচ্ছে আগামী মাসে", category: "পরিবহন" },
  { id: 3, text: "জাতীয় শিক্ষা বোর্ডের ফলাফল প্রকাশিত — ৮৫% পাসের হার", category: "শিক্ষা" },
  { id: 4, text: "প্রযুক্তি খাতে নতুন বিনিয়োগ নীতিমালা অনুমোদন", category: "প্রযুক্তি" },
  { id: 5, text: "দেশব্যাপী ডিজিটাল সেবা সম্প্রসারণ কর্মসূচি শুরু", category: "ডিজিটাল" },
];

const NewsTicker = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-foreground border-b border-foreground/10">
      {/* Marquee ticker */}
      <div className="overflow-hidden whitespace-nowrap py-2 border-b border-muted-foreground/20">
        <div className="animate-marquee flex gap-12 items-center w-max">
          {[...newsItems, ...newsItems].map((item, i) => (
            <span key={i} className="text-xs font-medium tracking-wide flex items-center gap-2 text-background/80">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <span className="font-meta text-background/50">{item.category}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Featured news rotator */}
      <div className="container py-3 flex items-center gap-4">
        <span className="font-meta text-primary flex-shrink-0">সর্বশেষ</span>
        <div className="relative h-6 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="absolute text-sm text-background/90 font-medium truncate w-full"
            >
              {newsItems[activeIndex].text}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {newsItems.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                i === activeIndex ? "bg-primary" : "bg-background/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
