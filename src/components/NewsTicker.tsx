import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

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
    <div className="w-full bg-foreground">
      {/* Marquee ticker */}
      <div className="overflow-hidden whitespace-nowrap py-1.5">
        <div className="animate-marquee flex gap-16 items-center w-max">
          {[...newsItems, ...newsItems].map((item, i) => (
            <span key={i} className="text-xs font-medium flex items-center gap-2 text-background/70">
              <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
              <span className="text-accent/80 font-meta">{item.category}</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Featured news rotator */}
      <div className="border-t border-background/10">
        <div className="container py-2.5 flex items-center gap-3">
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <Zap className="w-3 h-3 text-accent" />
            <span className="font-meta text-accent">সর্বশেষ</span>
          </span>
          <div className="relative h-5 flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeIndex}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute text-sm text-background/90 truncate w-full"
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
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIndex ? "bg-accent w-4" : "bg-background/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsTicker;
