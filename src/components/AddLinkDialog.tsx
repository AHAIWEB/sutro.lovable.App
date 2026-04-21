import { useState, useRef } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Send, Wand2, Loader2, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubmitLink, type CategoryRow } from "@/hooks/useLinks";
import { supabase } from "@/integrations/supabase/client";

const linkSchema = z.object({
  url: z.string().trim().url({ message: "সঠিক URL দিন" }).max(500),
  title: z.string().trim().min(1, { message: "শিরোনাম লিখুন" }).max(200),
  category: z.string().min(1, { message: "ক্যাটাগরি নির্বাচন করুন" }),
});

interface AddLinkDialogProps {
  categories: CategoryRow[];
}

const AddLinkDialog = ({ categories }: AddLinkDialogProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const submitLink = useSubmitLink();

  const handleAutoFetch = async () => {
    if (!url.trim()) {
      toast({ title: "আগে URL দিন", variant: "destructive" });
      return;
    }
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-metadata", {
        body: { url: url.trim() },
      });
      if (error) throw error;
      const t = data?.title || data?.metadata?.title || data?.items?.[0]?.title;
      const img = data?.image || data?.metadata?.image || data?.items?.[0]?.image;
      if (t) setTitle(t);
      if (img && !logoUrl) setLogoUrl(img);
      if (t || img) {
        toast({ title: "তথ্য পেয়েছি ✅", description: "শিরোনাম ও লোগো স্বয়ংক্রিয়ভাবে যোগ করা হলো" });
      } else {
        toast({ title: "তথ্য পাওয়া যায়নি", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "ফেচ ব্যর্থ", description: e.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({ title: "ফাইল ১MB এর কম হতে হবে", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `submitted/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
      setLogoUrl(pub.publicUrl);
      toast({ title: "লোগো আপলোড হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    const result = linkSchema.safeParse({ url, title, category });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await submitLink.mutateAsync({
        url: result.data.url,
        title: result.data.title,
        category_id: result.data.category,
        favicon: logoUrl.trim() || null,
      });
      toast({
        title: "সংযুক্ত হয়েছে! ✅",
        description: "আপনার লিংক পর্যালোচনার জন্য জমা হয়েছে।",
      });
      setUrl("");
      setTitle("");
      setCategory("");
      setLogoUrl("");
      setErrors({});
      setOpen(false);
    } catch {
      toast({
        title: "ত্রুটি",
        description: "লিংক জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs rounded-full px-4">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">সাইট জমা দিন</span>
          <span className="sm:hidden">জমা</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">নতুন সাইট জমা দিন</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            পর্যালোচনার পর আপনার সাইট যুক্ত হবে
          </p>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleAutoFetch}
                disabled={fetching || !url.trim()}
                title="URL থেকে শিরোনাম ও লোগো স্বয়ংক্রিয়ভাবে আনুন"
              >
                {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </Button>
            </div>
            {errors.url && <p className="text-xs text-destructive mt-1">{errors.url}</p>}
            <p className="text-[10px] text-muted-foreground mt-1">✨ বাটনে ক্লিক করে শিরোনাম ও লোগো স্বয়ংক্রিয়ভাবে নিন</p>
          </div>
          <div>
            <Input
              placeholder="সাইটের শিরোনাম"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>
          <div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
          </div>

          {/* Logo: upload OR URL */}
          <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <ImageIcon className="w-3.5 h-3.5" /> লোগো (ঐচ্ছিক)
              {logoUrl && (
                <img src={logoUrl} alt="logo preview" className="ml-auto w-7 h-7 rounded object-cover ring-1 ring-border bg-background" />
              )}
            </div>
            <Tabs defaultValue="upload">
              <TabsList className="h-7 w-full grid grid-cols-2">
                <TabsTrigger value="upload" className="text-[11px] h-5"><Upload className="w-3 h-3 mr-1" /> আপলোড</TabsTrigger>
                <TabsTrigger value="url" className="text-[11px] h-5">URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-2">
                <div className="flex items-center gap-2">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                    {uploading ? "আপলোড হচ্ছে..." : "ছবি বাছাই (≤1MB)"}
                  </Button>
                  {logoUrl && (
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setLogoUrl("")}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="url" className="mt-2">
                <Input
                  placeholder="https://.../logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="font-mono text-xs h-8"
                />
              </TabsContent>
            </Tabs>
            <p className="text-[10px] text-muted-foreground">না দিলে স্বয়ংক্রিয়ভাবে favicon ব্যবহার হবে</p>
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full gap-2"
            disabled={submitLink.isPending}
          >
            <Send className="w-4 h-4" />
            {submitLink.isPending ? "জমা হচ্ছে..." : "জমা দিন"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLinkDialog;
