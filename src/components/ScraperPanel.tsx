import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, Plus, Trash2, Save, Play, Clock } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCountries, useSubCategories } from "@/hooks/useCountries";
import { useCategories } from "@/hooks/useLinks";

interface ScrapedLink {
  title: string;
  url: string;
  favicon?: string;
}

const ScraperPanel = () => {
  const { toast } = useToast();
  const { data: countries = [] } = useCountries();
  const { data: subCategories = [] } = useSubCategories();
  const { data: categories = [] } = useCategories();

  const [sourceUrl, setSourceUrl] = useState("");
  const [configName, setConfigName] = useState("");
  const [loading, setLoading] = useState(false);
  const [scrapedLinks, setScrapedLinks] = useState<ScrapedLink[]>([]);
  const [targetCountryId, setTargetCountryId] = useState("");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [targetSubCategoryId, setTargetSubCategoryId] = useState("");
  const [autoRun, setAutoRun] = useState(false);
  const [intervalHours, setIntervalHours] = useState(6);
  const [importing, setImporting] = useState(false);
  const [savedConfigs, setSavedConfigs] = useState<any[]>([]);
  const [savingCfg, setSavingCfg] = useState(false);

  const loadConfigs = async () => {
    const { data } = await supabase.from("scraper_configs").select("*").order("created_at", { ascending: false });
    setSavedConfigs(data || []);
  };
  useEffect(() => { loadConfigs(); }, []);

  const handleSaveConfig = async () => {
    if (!configName.trim() || !sourceUrl.trim() || !targetCategoryId) {
      toast({ title: "নাম, URL ও ক্যাটাগরি লাগবে", variant: "destructive" });
      return;
    }
    setSavingCfg(true);
    const { error } = await supabase.from("scraper_configs").insert({
      name: configName.trim(),
      source_url: sourceUrl.trim(),
      target_category_id: targetCategoryId,
      target_country_id: targetCountryId || null,
      target_sub_category_id: targetSubCategoryId || null,
      is_active: true,
      auto_run: autoRun,
      run_interval_hours: intervalHours,
    });
    setSavingCfg(false);
    if (error) {
      toast({ title: "সেভ ব্যর্থ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "কনফিগ সেভ হয়েছে ✅" });
      setConfigName("");
      loadConfigs();
    }
  };

  const handleDeleteConfig = async (id: string) => {
    await supabase.from("scraper_configs").delete().eq("id", id);
    loadConfigs();
    toast({ title: "মুছে ফেলা হয়েছে" });
  };

  const handleToggleAutoRun = async (id: string, val: boolean) => {
    await supabase.from("scraper_configs").update({ auto_run: val }).eq("id", id);
    loadConfigs();
  };

  const handleRunNow = async (cfg: any) => {
    toast({ title: `${cfg.name} চলছে...` });
    setSourceUrl(cfg.source_url);
    setTargetCategoryId(cfg.target_category_id || "");
    setTargetCountryId(cfg.target_country_id || "");
    setTargetSubCategoryId(cfg.target_sub_category_id || "");
    setTimeout(() => handleScrape(), 100);
  };

  const handleScrape = async () => {
    if (!sourceUrl.trim()) return;
    setLoading(true);
    setScrapedLinks([]);

    try {
      // Use edge function for scraping
      const { data, error } = await supabase.functions.invoke("scrape-links", {
        body: { url: sourceUrl },
      });

      if (error) throw error;

      if (data?.links && Array.isArray(data.links)) {
        setScrapedLinks(data.links);
        toast({ title: `${data.links.length} টি লিংক পাওয়া গেছে ✅` });
      } else {
        toast({ title: "কোনো লিংক পাওয়া যায়নি", variant: "destructive" });
      }
    } catch (err: any) {
      toast({
        title: "স্ক্র্যাপিং ব্যর্থ",
        description: err.message || "সার্ভার এরর",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!targetCategoryId || scrapedLinks.length === 0) return;
    setImporting(true);

    try {
      const insertData = scrapedLinks.map((link) => ({
        title: link.title,
        url: link.url,
        favicon: link.favicon || null,
        category_id: targetCategoryId,
        country_id: targetCountryId || null,
        sub_category_id: targetSubCategoryId || null,
        status: "approved" as const,
      }));

      // Insert in batches of 100
      for (let i = 0; i < insertData.length; i += 100) {
        const batch = insertData.slice(i, i + 100);
        const { error } = await supabase.from("links").insert(batch);
        if (error) throw error;
      }

      toast({ title: `${scrapedLinks.length} টি লিংক ইমপোর্ট হয়েছে ✅` });
      setScrapedLinks([]);
    } catch (err: any) {
      toast({
        title: "ইমপোর্ট ব্যর্থ",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const removeLink = (index: number) => {
    setScrapedLinks((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" /> ওয়েবসাইট স্ক্র্যাপার
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://example.com/directory"
              className="font-mono text-xs"
            />
            <Button onClick={handleScrape} disabled={loading || !sourceUrl.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "স্ক্র্যাপ"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Select value={targetCountryId} onValueChange={setTargetCountryId}>
              <SelectTrigger><SelectValue placeholder="দেশ (ঐচ্ছিক)" /></SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.flag} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
              <SelectTrigger><SelectValue placeholder="ক্যাটাগরি *" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={targetSubCategoryId} onValueChange={setTargetSubCategoryId}>
              <SelectTrigger><SelectValue placeholder="সাব-ক্যাটাগরি (ঐচ্ছিক)" /></SelectTrigger>
              <SelectContent>
                {subCategories.map((sc) => (
                  <SelectItem key={sc.id} value={sc.id}>{sc.icon} {sc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {scrapedLinks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                স্ক্র্যাপ করা লিংক ({scrapedLinks.length})
              </CardTitle>
              <Button onClick={handleImport} disabled={importing || !targetCategoryId} size="sm">
                {importing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                সব ইমপোর্ট করো
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {scrapedLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2 p-2 hover:bg-muted/40 rounded-lg text-sm">
                  {link.favicon && (
                    <img src={link.favicon} alt="" className="w-4 h-4" />
                  )}
                  <span className="flex-1 truncate">{link.title}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">{link.url}</span>
                  <button onClick={() => removeLink(i)} className="text-destructive/60 hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScraperPanel;
