import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings, useUpdateSiteSetting, type SiteSettingsMap } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, Palette, Image as ImageIcon, Menu as MenuIcon, Type } from "lucide-react";

const SiteSettingsPanel = () => {
  const { data: settings } = useSiteSettings();
  const update = useUpdateSiteSetting();
  const { toast } = useToast();
  const [draft, setDraft] = useState<SiteSettingsMap | null>(null);

  useEffect(() => {
    if (settings && !draft) setDraft(settings);
  }, [settings, draft]);

  if (!draft) return <p className="text-sm text-muted-foreground">লোড হচ্ছে...</p>;

  const set = <K extends keyof SiteSettingsMap>(key: K, value: SiteSettingsMap[K]) =>
    setDraft({ ...draft, [key]: value });

  const saveOne = async (key: keyof SiteSettingsMap) => {
    await update.mutateAsync({ key, value: draft[key] });
    toast({ title: "সেভ হয়েছে ✅" });
  };

  const saveAll = async () => {
    const keys: (keyof SiteSettingsMap)[] = [
      "site_name", "site_tagline", "logo_url", "logo_emoji",
      "footer_text", "footer_links", "header_menu", "primary_color", "accent_color",
    ];
    for (const k of keys) await update.mutateAsync({ key: k, value: draft[k] });
    toast({ title: "সব সেটিংস সেভ হয়েছে ✅" });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={saveAll} className="gap-1.5"><Save className="w-4 h-4" /> সব সেভ করো</Button>
      </div>

      {/* Branding */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4" /> ব্র্যান্ডিং</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">সাইটের নাম</Label>
              <Input value={draft.site_name} onChange={(e) => set("site_name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">ট্যাগলাইন</Label>
              <Input value={draft.site_tagline} onChange={(e) => set("site_tagline", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">লোগো ইমোজি (URL না থাকলে)</Label>
              <Input value={draft.logo_emoji} onChange={(e) => set("logo_emoji", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" /> লোগো URL</Label>
              <Input value={draft.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme colors */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> থিম কালার (লাইভ প্রিভিউ)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">প্রাইমারি কালার</Label>
              <div className="flex gap-2">
                <Input type="color" value={draft.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="w-14 h-10 p-1" />
                <Input value={draft.primary_color} onChange={(e) => set("primary_color", e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-xs">অ্যাকসেন্ট কালার</Label>
              <div className="flex gap-2">
                <Input type="color" value={draft.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="w-14 h-10 p-1" />
                <Input value={draft.accent_color} onChange={(e) => set("accent_color", e.target.value)} className="font-mono text-xs" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="h-10 rounded-md flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: draft.primary_color }}>প্রাইমারি</div>
              <div className="h-10 rounded-md flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: draft.accent_color }}>অ্যাকসেন্ট</div>
            </div>
            <Button size="sm" onClick={async () => { await saveOne("primary_color"); await saveOne("accent_color"); }}>সেভ ও প্রয়োগ</Button>
          </div>
          <p className="text-[10px] text-muted-foreground">সেভ করার পর সম্পূর্ণ সাইটের থিম রিয়েল-টাইম আপডেট হবে।</p>
        </CardContent>
      </Card>

      {/* Header menu */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MenuIcon className="w-4 h-4" /> হেডার মেনু</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {draft.header_menu.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="লেবেল" value={item.label} onChange={(e) => {
                const next = [...draft.header_menu]; next[i] = { ...next[i], label: e.target.value }; set("header_menu", next);
              }} />
              <Input placeholder="URL" value={item.url} onChange={(e) => {
                const next = [...draft.header_menu]; next[i] = { ...next[i], url: e.target.value }; set("header_menu", next);
              }} className="font-mono text-xs" />
              <Button size="icon" variant="ghost" onClick={() => set("header_menu", draft.header_menu.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => set("header_menu", [...draft.header_menu, { label: "", url: "" }])}>
            <Plus className="w-3 h-3 mr-1" /> মেনু আইটেম যোগ
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <Card>
        <CardHeader><CardTitle className="text-base">ফুটার</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">ফুটার টেক্সট</Label>
            <Textarea value={draft.footer_text} onChange={(e) => set("footer_text", e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">ফুটার লিংক</Label>
            {draft.footer_links.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="লেবেল" value={item.label} onChange={(e) => {
                  const next = [...draft.footer_links]; next[i] = { ...next[i], label: e.target.value }; set("footer_links", next);
                }} />
                <Input placeholder="URL" value={item.url} onChange={(e) => {
                  const next = [...draft.footer_links]; next[i] = { ...next[i], url: e.target.value }; set("footer_links", next);
                }} className="font-mono text-xs" />
                <Button size="icon" variant="ghost" onClick={() => set("footer_links", draft.footer_links.filter((_, j) => j !== i))}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => set("footer_links", [...draft.footer_links, { label: "", url: "" }])}>
              <Plus className="w-3 h-3 mr-1" /> ফুটার লিংক যোগ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteSettingsPanel;
