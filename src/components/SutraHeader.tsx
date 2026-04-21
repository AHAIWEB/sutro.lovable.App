import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Globe, Shield, LogIn, LogOut, Moon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddLinkDialog from "./AddLinkDialog";
import type { CategoryRow } from "@/hooks/useLinks";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useDarkMode } from "@/hooks/useDarkMode";

interface SutraHeaderProps {
  categories: CategoryRow[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalLinks: number;
}

const SutraHeader = ({ categories, searchQuery, onSearchChange, totalLinks }: SutraHeaderProps) => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const { isDark, toggle: toggleDark } = useDarkMode();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const siteName = settings?.site_name || "সূত্র";
  const tagline = settings?.site_tagline;
  const logoUrl = settings?.logo_url;
  const logoUrlDark = settings?.logo_url_dark;
  const logoEmoji = settings?.logo_emoji;
  const logoSize = settings?.logo_size || "medium";
  const headerMenu = settings?.header_menu || [];

  const activeLogoUrl = isDark && logoUrlDark ? logoUrlDark : logoUrl;
  const sizeClass =
    logoSize === "small" ? "h-8 sm:h-9 max-w-[140px] sm:max-w-[170px]" :
    logoSize === "large" ? "h-12 sm:h-14 max-w-[220px] sm:max-w-[280px]" :
    "h-10 sm:h-11 max-w-[180px] sm:max-w-[220px]";

  return (
    <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-30">
      <div className="container flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          {activeLogoUrl ? (
            <a href="/" className={`flex items-center overflow-hidden ${sizeClass}`}>
              <img
                src={activeLogoUrl}
                alt={siteName}
                className="h-full w-auto object-contain"
              />
            </a>
          ) : (
            <>
              <div className="h-10 px-2.5 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md shadow-primary/20">
                {logoEmoji ? (
                  <span className="text-lg">{logoEmoji}</span>
                ) : (
                  <Globe className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <div>
                <h1 className="font-display text-xl text-foreground leading-none">{siteName}</h1>
                <span className="font-meta text-muted-foreground hidden sm:block">
                  {tagline || `${totalLinks.toLocaleString("bn-BD")} টি সাইট`}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="সাইট খুঁজুন..."
            className="pl-9 text-sm bg-background/60 border-border/60 focus:bg-background transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          {headerMenu.length > 0 && (
            <nav className="hidden md:flex items-center gap-1 mr-2">
              {headerMenu.filter((m) => m.label && m.url).slice(0, 4).map((m, i) => (
                <a
                  key={i}
                  href={m.url}
                  target={m.url.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded-md hover:bg-muted transition-colors"
                >
                  {m.label}
                </a>
              ))}
            </nav>
          )}
          <AddLinkDialog categories={categories} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleDark}
            title={isDark ? "লাইট মোড" : "ডার্ক মোড"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/admin")}>
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">অ্যাডমিন</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout} title="লগআউট">
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/auth")}>
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">লগইন</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default SutraHeader;
