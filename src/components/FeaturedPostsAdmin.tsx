import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useFeaturedPosts, useAddFeaturedPost, useUpdateFeaturedPost, useDeleteFeaturedPost,
} from "@/hooks/useCountries";
import { Plus, Trash2, Loader2, Link2, Rss, Globe, RefreshCw, Eye, EyeOff, Sparkles, GripVertical } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const FeaturedPostsAdmin = () => {
  const { toast } = useToast();
  const { data: posts = [] } = useFeaturedPosts();
  const addPost = useAddFeaturedPost();
  const updatePost = useUpdateFeaturedPost();
  const deletePost = useDeleteFeaturedPost();

  // Add dialog
  const [open, setOpen] = useState(false);
  const [addMode, setAddMode] = useState<"manual" | "url" | "rss" | "category">("manual");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sourceName, setSourceName] = useState("");

  // Fetch states
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchedItems, setFetchedItems] = useState<any[]>([]);
  const [maxPosts, setMaxPosts] = useState("5");
  const [autoFetch, setAutoFetch] = useState(false);

  const handleManualAdd = () => {
    if (!title || !url) return;
    addPost.mutate(
      { title, url, image_url: imageUrl || null, description: description || null, source_name: sourceName || null, auto_fetch: false },
      {
        onSuccess: () => {
          toast({ title: "ফিচার পোস্ট যোগ হয়েছে ✅" });
          resetForm();
        },
      }
    );
  };

  const handleFetchMetadata = async () => {
    if (!fetchUrl.trim()) return;
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-metadata", {
        body: { url: fetchUrl, mode: "metadata" },
      });
      if (error) throw error;
      if (data?.title) {
        setTitle(data.title);
        setImageUrl(data.image || "");
        setDescription(data.description || "");
        setSourceName(data.site_name || "");
        setUrl(fetchUrl);
        toast({ title: "মেটাডাটা ফেচ হয়েছে ✅" });
      } else {
        toast({ title: "মেটাডাটা পাওয়া যায়নি", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "ফেচ ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleFetchRssOrCategory = async (mode: "rss" | "category") => {
    if (!fetchUrl.trim()) return;
    setFetching(true);
    setFetchedItems([]);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-metadata", {
        body: { url: fetchUrl, mode },
      });
      if (error) throw error;
      if (data?.items?.length) {
        setFetchedItems(data.items.slice(0, parseInt(maxPosts) || 10));
        toast({ title: `${data.items.length} টি আইটেম পাওয়া গেছে ✅` });
      } else {
        toast({ title: "কোনো আইটেম পাওয়া যায়নি", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "ফেচ ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setFetching(false);
    }
  };

  const handleImportItems = async (items: any[]) => {
    try {
      for (const item of items) {
        const { error } = await supabase.from("featured_posts").insert({
          title: item.title,
          url: item.url,
          image_url: item.image || null,
          description: item.description || null,
          source_name: item.source || sourceName || null,
          auto_fetch: autoFetch,
          fetch_url: autoFetch ? fetchUrl : null,
          is_active: true,
        } as any);
        if (error) throw error;
      }
      toast({ title: `${items.length} টি পোস্ট ইমপোর্ট হয়েছে ✅` });
      setFetchedItems([]);
      resetForm();
    } catch (err: any) {
      toast({ title: "ইমপোর্ট ব্যর্থ", description: err.message, variant: "destructive" });
    }
  };

  const handleMovePost = (id: string, direction: "up" | "down") => {
    const idx = posts.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const newOrder = direction === "up" ? Math.max(0, posts[idx].sort_order - 1) : posts[idx].sort_order + 1;
    updatePost.mutate({ id, sort_order: newOrder });
  };

  const resetForm = () => {
    setTitle(""); setUrl(""); setImageUrl(""); setDescription(""); setSourceName("");
    setFetchUrl(""); setFetchedItems([]); setAutoFetch(false); setOpen(false);
  };

  const handleBulkToggle = async (active: boolean) => {
    try {
      const ids = posts.map((p) => p.id);
      await Promise.all(ids.map((id) => updatePost.mutateAsync({ id, is_active: active })));
      toast({ title: active ? "সব পোস্ট সক্রিয় ✅" : "সব পোস্ট নিষ্ক্রিয় ⏸️" });
    } catch (err: any) {
      toast({ title: "ব্যর্থ", description: err.message, variant: "destructive" });
    }
  };

  const handleRefreshNow = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("refresh-featured-posts");
      if (error) throw error;
      toast({
        title: "রিফ্রেশ সম্পন্ন ✅",
        description: `${data?.refreshed ?? 0} টি আপডেট, ${data?.deleted ?? 0} টি junk ডিলিট`,
      });
    } catch (err: any) {
      toast({ title: "রিফ্রেশ ব্যর্থ", description: err.message, variant: "destructive" });
    }
  };

  const activeCount = posts.filter((p) => p.is_active).length;
  const autoCount = posts.filter((p) => p.auto_fetch).length;

  return (
    <div className="space-y-4">
      {/* Live stats dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">মোট পোস্ট</p>
            <p className="text-2xl font-bold text-primary">{posts.length.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">সক্রিয়</p>
            <p className="text-2xl font-bold text-emerald-600">{activeCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">অটো-ফেচ</p>
            <p className="text-2xl font-bold text-amber-600">{autoCount.toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-sky-500/10 to-sky-500/5 border-sky-500/20">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">ম্যানুয়াল</p>
            <p className="text-2xl font-bold text-sky-600">{(posts.length - autoCount).toLocaleString("bn-BD")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)} className="gap-1 h-8">
            <Eye className="w-3.5 h-3.5" /> সব চালু
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)} className="gap-1 h-8">
            <EyeOff className="w-3.5 h-3.5" /> সব বন্ধ
          </Button>
          <Button size="sm" variant="outline" onClick={handleRefreshNow} className="gap-1 h-8">
            <RefreshCw className="w-3.5 h-3.5" /> এখনই রিফ্রেশ
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Sparkles className="w-4 h-4" /> নতুন ফিচার পোস্ট
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ফিচার পোস্ট যোগ</DialogTitle>
            </DialogHeader>
            
            <Tabs value={addMode} onValueChange={(v) => { setAddMode(v as any); setFetchedItems([]); }}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="manual" className="text-xs gap-1"><Plus className="w-3 h-3" /> ম্যানুয়াল</TabsTrigger>
                <TabsTrigger value="url" className="text-xs gap-1"><Link2 className="w-3 h-3" /> URL</TabsTrigger>
                <TabsTrigger value="rss" className="text-xs gap-1"><Rss className="w-3 h-3" /> RSS</TabsTrigger>
                <TabsTrigger value="category" className="text-xs gap-1"><Globe className="w-3 h-3" /> ক্যাটাগরি</TabsTrigger>
              </TabsList>

              {/* Manual */}
              <TabsContent value="manual" className="space-y-3 mt-3">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="শিরোনাম *" />
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL *" className="font-mono text-xs" />
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="ছবি URL" />
                {imageUrl && <img src={imageUrl} alt="" className="w-full h-28 object-cover rounded-lg border" />}
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="বিবরণ" />
                <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="সোর্স নাম" />
                <Button className="w-full" onClick={handleManualAdd}>যোগ করুন</Button>
              </TabsContent>

              {/* URL Auto-fetch */}
              <TabsContent value="url" className="space-y-3 mt-3">
                <div className="flex gap-2">
                  <Input value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} placeholder="https://samakal.com/politics/article" className="font-mono text-xs" />
                  <Button onClick={handleFetchMetadata} disabled={fetching} size="sm">
                    {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "ফেচ"}
                  </Button>
                </div>
                {title && (
                  <div className="space-y-3 border-t pt-3">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="শিরোনাম" />
                    {imageUrl && <img src={imageUrl} alt="" className="w-full h-32 object-cover rounded-lg" />}
                    <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="ছবি URL" />
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="বিবরণ" />
                    <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="সোর্স" />
                    <Button className="w-full" onClick={handleManualAdd}>পোস্ট যোগ করুন</Button>
                  </div>
                )}
              </TabsContent>

              {/* RSS */}
              <TabsContent value="rss" className="space-y-3 mt-3">
                <div className="flex gap-2">
                  <Input value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} placeholder="https://samakal.com/rss" className="font-mono text-xs" />
                  <Button onClick={() => handleFetchRssOrCategory("rss")} disabled={fetching} size="sm">
                    {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "ফেচ"}
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={maxPosts} onValueChange={setMaxPosts}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 10, 15, 20].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} টি</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">সর্বোচ্চ পোস্ট</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Switch checked={autoFetch} onCheckedChange={setAutoFetch} />
                    <span className="text-xs">অটো-ফেচ</span>
                  </div>
                </div>
                <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="সোর্স নাম (ঐচ্ছিক)" />
                <FetchedItemsList items={fetchedItems} onImport={handleImportItems} onRemove={(i) => setFetchedItems(prev => prev.filter((_, idx) => idx !== i))} />
              </TabsContent>

              {/* Category page */}
              <TabsContent value="category" className="space-y-3 mt-3">
                <div className="flex gap-2">
                  <Input value={fetchUrl} onChange={(e) => setFetchUrl(e.target.value)} placeholder="https://samakal.com/politics" className="font-mono text-xs" />
                  <Button onClick={() => handleFetchRssOrCategory("category")} disabled={fetching} size="sm">
                    {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "ফেচ"}
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={maxPosts} onValueChange={setMaxPosts}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 5, 10, 15, 20].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} টি</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">সর্বোচ্চ পোস্ট</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Switch checked={autoFetch} onCheckedChange={setAutoFetch} />
                    <span className="text-xs">অটো-ফেচ</span>
                  </div>
                </div>
                <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="সোর্স নাম (ঐচ্ছিক)" />
                <FetchedItemsList items={fetchedItems} onImport={handleImportItems} onRemove={(i) => setFetchedItems(prev => prev.filter((_, idx) => idx !== i))} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing posts list */}
      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => handleMovePost(post.id, "up")} className="text-muted-foreground hover:text-foreground p-0.5">
                <ArrowUp className="w-3 h-3" />
              </button>
              <button onClick={() => handleMovePost(post.id, "down")} className="text-muted-foreground hover:text-foreground p-0.5">
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-12 h-9 rounded object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs truncate">{post.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{post.url}</p>
              <div className="flex gap-1 mt-0.5">
                {post.auto_fetch && <Badge variant="secondary" className="text-[9px] px-1 py-0">অটো</Badge>}
                {post.source_name && <Badge variant="outline" className="text-[9px] px-1 py-0">{post.source_name}</Badge>}
              </div>
            </div>
            <Switch
              checked={post.is_active}
              onCheckedChange={(checked) => updatePost.mutate({ id: post.id, is_active: checked })}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive"
              onClick={() => deletePost.mutate(post.id, {
                onSuccess: () => toast({ title: "ডিলিট হয়েছে" }),
              })}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {posts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            কোনো ফিচার পোস্ট নেই। URL, RSS বা ক্যাটাগরি পেজ থেকে অটো-ফেচ করে যোগ করুন।
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function FetchedItemsList({ items, onImport, onRemove }: { items: any[]; onImport: (items: any[]) => void; onRemove: (i: number) => void }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2 border-t pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{items.length} টি আইটেম</span>
        <Button size="sm" onClick={() => onImport(items)}>
          <Plus className="w-3 h-3 mr-1" /> সব ইমপোর্ট
        </Button>
      </div>
      <div className="space-y-1 max-h-[250px] overflow-y-auto">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
            {item.image && <img src={item.image} alt="" className="w-10 h-7 rounded object-cover flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{item.title}</p>
              <p className="truncate text-[10px] text-muted-foreground">{item.url}</p>
            </div>
            <button onClick={() => onRemove(i)} className="text-destructive/60 hover:text-destructive flex-shrink-0">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeaturedPostsAdmin;
