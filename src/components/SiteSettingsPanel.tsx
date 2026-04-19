import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSiteSettings, useUpdateSiteSetting, type SiteSettingsMap } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Plus, Trash2, Palette, Image as ImageIcon, Menu as MenuIcon, Type, Upload, Newspaper, Loader2, LayoutGrid, GalleryHorizontal, List as ListIcon } from "lucide-react";

const SiteSettingsPanel = () => {
  const { data: settings } = useSiteSettings();
  const update = useUpdateSiteSetting();
  const { toast } = useToast();
  const [draft, setDraft] = useState<SiteSettingsMap | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
      "footer_text", "footer_links", "header_menu", "primary_color", "accent_color", "featured_count", "featured_layout",
    ];
    for (const k of keys) await update.mutateAsync({ key: k, value: draft[k] });
    toast({ title: "সব সেটিংস সেভ হয়েছে ✅" });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "ফাইল ২MB এর কম হতে হবে", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      set("logo_url", pub.publicUrl);
      await update.mutateAsync({ key: "logo_url", value: pub.publicUrl });
      toast({ title: "লোগো আপলোড হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
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
          <div>
            <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" /> লোগো</Label>
            <Tabs defaultValue={draft.logo_url ? "url" : "upload"} className="mt-1">
              <TabsList className="h-8">
                <TabsTrigger value="upload" className="text-xs h-6"><Upload className="w-3 h-3 mr-1" /> আপলোড</TabsTrigger>
                <TabsTrigger value="url" className="text-xs h-6">URL</TabsTrigger>
                <TabsTrigger value="emoji" className="text-xs h-6">ইমোজি</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-2">
                <div className="flex items-center gap-3">
                  {draft.logo_url && (
                    <img src={draft.logo_url} alt="logo" className="w-12 h-12 rounded-lg object-cover ring-1 ring-border bg-muted" />
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                    {uploading ? "আপলোড হচ্ছে..." : "ছবি বাছাই (≤2MB)"}
                  </Button>
                  {draft.logo_url && (
                    <Button size="sm" variant="ghost" onClick={async () => { set("logo_url", ""); await update.mutateAsync({ key: "logo_url", value: "" }); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="url" className="mt-2">
                <Input value={draft.logo_url} onChange={(e) => set("logo_url", e.target.value)} placeholder="https://..." className="font-mono text-xs" />
              </TabsContent>
              <TabsContent value="emoji" className="mt-2">
                <Input value={draft.logo_emoji} onChange={(e) => set("logo_emoji", e.target.value)} placeholder="📚" className="text-2xl" />
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div>
              <Label className="text-xs flex items-center gap-1"><Newspaper className="w-3 h-3" /> ফিচার্ড পোস্ট সংখ্যা</Label>
              <Input
                type="number"
                min={3}
                max={12}
                value={draft.featured_count}
                onChange={(e) => set("featured_count", Math.max(3, Math.min(12, parseInt(e.target.value) || 6)))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">৩-১২ এর মধ্যে</p>
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
