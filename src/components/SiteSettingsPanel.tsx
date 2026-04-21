import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSiteSettings, useUpdateSiteSetting, type SiteSettingsMap, GOOGLE_FONTS } from "@/hooks/useSiteSettings";
import { preloadFont } from "@/hooks/useGoogleFonts";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Save, Plus, Trash2, Palette, Image as ImageIcon, Menu as MenuIcon, Type, Upload, Newspaper,
  Loader2, LayoutGrid, GalleryHorizontal, List as ListIcon, Columns2, Megaphone, Moon, Sun, Ruler,
} from "lucide-react";

const SiteSettingsPanel = () => {
  const { data: settings } = useSiteSettings();
  const update = useUpdateSiteSetting();
  const { toast } = useToast();
  const [draft, setDraft] = useState<SiteSettingsMap | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileRefDark = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"light" | "dark" | null>(null);

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
    const keys = Object.keys(draft) as (keyof SiteSettingsMap)[];
    for (const k of keys) await update.mutateAsync({ key: k, value: draft[k] });
    toast({ title: "সব সেটিংস সেভ হয়েছে ✅" });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, variant: "light" | "dark") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "ফাইল ২MB এর কম হতে হবে", variant: "destructive" });
      return;
    }
    setUploading(variant);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logo-${variant}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      const key = variant === "dark" ? "logo_url_dark" : "logo_url";
      set(key, pub.publicUrl);
      await update.mutateAsync({ key, value: pub.publicUrl });
      toast({ title: `${variant === "dark" ? "ডার্ক" : "লাইট"} লোগো আপলোড হয়েছে ✅` });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
      const ref = variant === "dark" ? fileRefDark : fileRef;
      if (ref.current) ref.current.value = "";
    }
  };

  const renderLogoBlock = (
    variant: "light" | "dark",
    urlKey: "logo_url" | "logo_url_dark",
    ref: React.RefObject<HTMLInputElement>,
  ) => (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        {variant === "dark" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        {variant === "dark" ? "ডার্ক মোড লোগো" : "লাইট মোড লোগো"}
      </div>
      <Tabs defaultValue={draft[urlKey] ? "url" : "upload"}>
        <TabsList className="h-7">
          <TabsTrigger value="upload" className="text-[11px] h-5"><Upload className="w-3 h-3 mr-1" /> আপলোড</TabsTrigger>
          <TabsTrigger value="url" className="text-[11px] h-5">URL</TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-2">
          <div className="flex items-center gap-2">
            {draft[urlKey] && (
              <img src={draft[urlKey]} alt="logo" className={`h-10 w-auto max-w-[120px] object-contain rounded ring-1 ring-border ${variant === "dark" ? "bg-zinc-900" : "bg-muted"}`} />
            )}
            <input ref={ref} type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, variant)} className="hidden" />
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => ref.current?.click()} disabled={uploading === variant}>
              {uploading === variant ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
              {uploading === variant ? "আপলোড..." : "ছবি বাছাই"}
            </Button>
            {draft[urlKey] && (
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={async () => { set(urlKey, ""); await update.mutateAsync({ key: urlKey, value: "" }); }}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            )}
          </div>
        </TabsContent>
        <TabsContent value="url" className="mt-2">
          <Input value={draft[urlKey]} onChange={(e) => set(urlKey, e.target.value)} placeholder="https://..." className="font-mono text-xs h-8" />
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderAdSlot = (key: "ad_top" | "ad_mid" | "ad_bottom", label: string, hint: string) => {
    const slot = draft[key];
    return (
      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium flex items-center gap-1">
            <Megaphone className="w-3.5 h-3.5" /> {label}
          </Label>
          <Switch
            checked={slot.enabled}
            onCheckedChange={async (v) => {
              const next = { ...slot, enabled: v };
              set(key, next);
              await update.mutateAsync({ key, value: next });
            }}
          />
        </div>
        <Textarea
          value={slot.html}
          onChange={(e) => set(key, { ...slot, html: e.target.value })}
          rows={3}
          placeholder='<a href="..."><img src="..." alt="ad" /></a>  বা AdSense snippet'
          className="font-mono text-[11px]"
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">{hint}</p>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => saveOne(key)}>সেভ</Button>
        </div>
      </div>
    );
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

          {/* Logos: light + dark */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {renderLogoBlock("light", "logo_url", fileRef)}
            {renderLogoBlock("dark", "logo_url_dark", fileRefDark)}
          </div>

          {/* Logo emoji fallback + size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" /> ইমোজি (লোগো না থাকলে)</Label>
              <Input value={draft.logo_emoji} onChange={(e) => set("logo_emoji", e.target.value)} placeholder="📚" className="text-2xl" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Ruler className="w-3 h-3" /> লোগো সাইজ</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {(["small", "medium", "large"] as const).map((s) => {
                  const active = draft.logo_size === s;
                  const label = s === "small" ? "ছোট" : s === "medium" ? "মাঝারি" : "বড়";
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={async () => { set("logo_size", s); await update.mutateAsync({ key: "logo_size", value: s }); toast({ title: `সাইজ: ${label} ✅` }); }}
                      className={`px-2 py-2 rounded-md border text-xs transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-muted-foreground"}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
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
            <div>
              <Label className="text-xs flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> ফিচার্ড লেআউট</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1">
                {([
                  { v: "carousel", label: "ক্যারোসেল", Icon: GalleryHorizontal },
                  { v: "magazine", label: "ম্যাগাজিন", Icon: LayoutGrid },
                  { v: "minimal", label: "মিনিমাল", Icon: ListIcon },
                  { v: "hero-sidebar", label: "হিরো+সাইডবার", Icon: Columns2 },
                ] as const).map(({ v, label, Icon }) => {
                  const active = draft.featured_layout === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={async () => {
                        set("featured_layout", v);
                        await update.mutateAsync({ key: "featured_layout", value: v });
                        toast({ title: `লেআউট: ${label} ✅` });
                      }}
                      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-md border text-[10px] transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40 text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4" /> টাইপোগ্রাফি (Google Fonts)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["font_heading", "font_body"] as const).map((k) => (
              <div key={k}>
                <Label className="text-xs">{k === "font_heading" ? "হেডিং ফন্ট" : "বডি ফন্ট"}</Label>
                <Select
                  value={GOOGLE_FONTS.includes(draft[k]) ? draft[k] : "__custom__"}
                  onValueChange={async (v) => {
                    if (v === "__custom__") return;
                    set(k, v);
                    preloadFont(v);
                    await update.mutateAsync({ key: k, value: v });
                  }}
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {GOOGLE_FONTS.map((f) => (
                      <SelectItem key={f} value={f} style={{ fontFamily: `'${f}', system-ui` }}>{f}</SelectItem>
                    ))}
                    <SelectItem value="__custom__">— কাস্টম নাম টাইপ করুন ↓</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="mt-1.5 h-8 text-xs"
                  value={draft[k]}
                  onChange={(e) => set(k, e.target.value)}
                  onBlur={async () => { preloadFont(draft[k]); await update.mutateAsync({ key: k, value: draft[k] }); }}
                  placeholder="যেকোনো Google Font name..."
                />
                <p className="text-xs mt-1.5 px-2 py-1.5 rounded bg-muted/50" style={{ fontFamily: `'${draft[k]}', system-ui` }}>
                  নমুনা — Sample Text ১২৩
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">📌 সেভ করার সাথে সাথে পুরো সাইটে ফন্ট লাইভ আপডেট হয়।</p>
        </CardContent>
      </Card>

      {/* Theme colors */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> থিম কালার</CardTitle></CardHeader>
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
        </CardContent>
      </Card>

      {/* Ad slots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Megaphone className="w-4 h-4" /> বিজ্ঞাপন স্লট</CardTitle>
          <p className="text-[11px] text-muted-foreground">Google AdSense, banner image, বা যেকোনো HTML snippet বসান। বন্ধ থাকলে দেখা যাবে না।</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {renderAdSlot("ad_top", "টপ ব্যানার (হেডারের নিচে)", "প্রতি পেজে হেডারের ঠিক নিচে দেখাবে")}
          {renderAdSlot("ad_mid", "মিড ব্যানার (ফিচার্ডের পরে)", "ফিচার্ড সেকশনের পরে এবং মূল গ্রিডের আগে")}
          {renderAdSlot("ad_bottom", "বটম ব্যানার (ফুটারের আগে)", "পেজের নিচে ফুটারের ঠিক আগে")}
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
