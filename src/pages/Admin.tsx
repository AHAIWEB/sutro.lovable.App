import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useLinks";
import {
  useIsAdmin, useAllLinks, useUpdateLink, useDeleteLink, useAddLink,
  useAddCategory, useUpdateCategory, useDeleteCategory,
} from "@/hooks/useAdmin";
import {
  LogOut, Check, X, Trash2, Edit, Plus, ArrowLeft, Globe, Shield, Link2, FolderOpen, Star,
  Search as SearchIcon, Settings, TrendingUp, Eye, Sparkles, Activity,
} from "lucide-react";
import BulkImportDialog from "@/components/BulkImportDialog";
import ScraperPanel from "@/components/ScraperPanel";
import FeaturedPostsAdmin from "@/components/FeaturedPostsAdmin";
import SiteSettingsPanel from "@/components/SiteSettingsPanel";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: links = [], isLoading: linksLoading } = useAllLinks();
  const { data: categories = [] } = useCategories();
  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const addLink = useAddLink();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
      if (!s) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (!s) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (adminLoading || linksLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <Shield className="w-12 h-12 text-destructive mx-auto mb-2" />
            <CardTitle>অ্যাক্সেস নেই</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              আপনার অ্যাডমিন অ্যাক্সেস নেই।
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate("/")} size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" /> হোম
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="w-4 h-4 mr-1" /> লগআউট
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingLinks = links.filter((l) => l.status === "pending");
  const approvedLinks = links.filter((l) => l.status === "approved");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-30">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-lg text-foreground">অ্যাডমিন প্যানেল</h1>
              <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> হোম
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> লগআউট
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Dynamic Stats Dashboard */}
        <DynamicDashboard links={links} categories={categories} pendingCount={pendingLinks.length} approvedCount={approvedLinks.length} />

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="pending" className="gap-1 text-xs">
              পেন্ডিং
              {pendingLinks.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0">
                  {pendingLinks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="links" className="text-xs">
              <Link2 className="w-3.5 h-3.5 mr-1" /> লিংক
            </TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">
              <FolderOpen className="w-3.5 h-3.5 mr-1" /> ক্যাটাগরি
            </TabsTrigger>
            <TabsTrigger value="scraper" className="text-xs">
              <SearchIcon className="w-3.5 h-3.5 mr-1" /> স্ক্র্যাপার
            </TabsTrigger>
            <TabsTrigger value="featured" className="text-xs">
              <Star className="w-3.5 h-3.5 mr-1" /> ফিচার
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="w-3.5 h-3.5 mr-1" /> সেটিংস
            </TabsTrigger>
          </TabsList>

          {/* PENDING */}
          <TabsContent value="pending" className="space-y-3">
            {pendingLinks.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  কোনো পেন্ডিং লিংক নেই ✅
                </CardContent>
              </Card>
            ) : (
              pendingLinks.map((link) => (
                <PendingLinkCard
                  key={link.id}
                  link={link}
                  categories={categories}
                  onApprove={() => {
                    updateLink.mutate({ id: link.id, status: "approved" }, {
                      onSuccess: () => toast({ title: "অ্যাপ্রুভ হয়েছে ✅" }),
                    });
                  }}
                  onReject={() => {
                    deleteLink.mutate(link.id, {
                      onSuccess: () => toast({ title: "রিজেক্ট হয়েছে" }),
                    });
                  }}
                />
              ))
            )}
          </TabsContent>

          {/* ALL LINKS */}
          <TabsContent value="links" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <AddLinkForm categories={categories} onAdd={addLink} />
              <BulkImportDialog categories={categories} />
            </div>
            {approvedLinks.map((link) => (
              <LinkManageCard
                key={link.id}
                link={link}
                categories={categories}
                onUpdate={updateLink}
                onDelete={deleteLink}
              />
            ))}
          </TabsContent>

          {/* CATEGORIES */}
          <TabsContent value="categories" className="space-y-3">
            <AddCategoryForm onAdd={addCategory} categoriesCount={categories.length} />
            {categories.map((cat) => (
              <CategoryManageCard
                key={cat.id}
                category={cat}
                onUpdate={updateCategory}
                onDelete={deleteCategory}
              />
            ))}
          </TabsContent>

          {/* SCRAPER */}
          <TabsContent value="scraper">
            <ScraperPanel />
          </TabsContent>

          {/* FEATURED POSTS */}
          <TabsContent value="featured">
            <FeaturedPostsAdmin />
          </TabsContent>

          {/* SITE SETTINGS */}
          <TabsContent value="settings">
            <SiteSettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

/* ─── Sub-components ───────────────────────────────────────── */

function PendingLinkCard({ link, categories, onApprove, onReject }: any) {
  const catName = categories.find((c: any) => c.id === link.category_id)?.name || link.category_id;
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{link.title}</p>
          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
          <Badge variant="outline" className="mt-1 text-[10px]">{catName}</Badge>
        </div>
        <div className="flex gap-1.5">
          <Button size="icon" variant="outline" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={onApprove}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={onReject}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LinkManageCard({ link, categories, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url);
  const [categoryId, setCategoryId] = useState(link.category_id);
  const { toast } = useToast();

  return (
    <Card>
      <CardContent className="p-4">
        {editing ? (
          <div className="space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="শিরোনাম" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" className="font-mono text-xs" />
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                onUpdate.mutate({ id: link.id, title, url, category_id: categoryId }, {
                  onSuccess: () => { toast({ title: "আপডেট হয়েছে ✅" }); setEditing(false); },
                });
              }}>সেভ</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>বাতিল</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{link.title}</p>
              <p className="text-xs text-muted-foreground truncate">{link.url}</p>
            </div>
            <div className="flex gap-1.5">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                onDelete.mutate(link.id, {
                  onSuccess: () => toast({ title: "ডিলিট হয়েছে" }),
                });
              }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddLinkForm({ categories, onAdd }: any) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> নতুন লিংক
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>নতুন লিংক যোগ করুন</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="শিরোনাম" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="font-mono text-xs" />
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="ক্যাটাগরি" /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full" onClick={() => {
            if (!title || !url || !categoryId) return;
            onAdd.mutate({ title, url, category_id: categoryId, status: "approved" }, {
              onSuccess: () => {
                toast({ title: "লিংক যোগ হয়েছে ✅" });
                setTitle(""); setUrl(""); setCategoryId(""); setOpen(false);
              },
            });
          }}>যোগ করুন</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddCategoryForm({ onAdd, categoriesCount }: any) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [icon, setIcon] = useState("📋");
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> নতুন ক্যাটাগরি
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>নতুন ক্যাটাগরি</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="আইকন (emoji)" />
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="নাম (বাংলা)" />
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Name (English)" />
          <Button className="w-full" onClick={() => {
            if (!name || !nameEn) return;
            const id = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            onAdd.mutate({ id, name, name_en: nameEn, icon, sort_order: categoriesCount + 1 }, {
              onSuccess: () => {
                toast({ title: "ক্যাটাগরি যোগ হয়েছে ✅" });
                setName(""); setNameEn(""); setIcon("📋"); setOpen(false);
              },
            });
          }}>যোগ করুন</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManageCard({ category, onUpdate, onDelete }: any) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [nameEn, setNameEn] = useState(category.name_en);
  const [icon, setIcon] = useState(category.icon);
  const { toast } = useToast();

  return (
    <Card>
      <CardContent className="p-4">
        {editing ? (
          <div className="space-y-2">
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="আইকন" />
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="নাম" />
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Name EN" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => {
                onUpdate.mutate({ id: category.id, name, name_en: nameEn, icon }, {
                  onSuccess: () => { toast({ title: "আপডেট হয়েছে ✅" }); setEditing(false); },
                });
              }}>সেভ</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>বাতিল</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xl">{category.icon}</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{category.name}</p>
              <p className="text-xs text-muted-foreground">{category.name_en}</p>
            </div>
            <div className="flex gap-1.5">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(true)}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => {
                onDelete.mutate(category.id, {
                  onSuccess: () => toast({ title: "ডিলিট হয়েছে" }),
                });
              }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Dynamic Dashboard ───────────────────────────────────── */
function DynamicDashboard({ links, categories, pendingCount, approvedCount }: any) {
  const totalVisits = links.reduce((sum: number, l: any) => sum + (l.visits || 0), 0);
  const last7d = links.filter((l: any) => {
    const d = new Date(l.created_at).getTime();
    return d > Date.now() - 7 * 24 * 3600 * 1000;
  }).length;
  const topLink = [...links].sort((a: any, b: any) => (b.visits || 0) - (a.visits || 0))[0];
  const recentPending = links.filter((l: any) => l.status === "pending").slice(0, 3);

  const catDist: Record<string, number> = {};
  links.forEach((l: any) => { catDist[l.category_id] = (catDist[l.category_id] || 0) + 1; });
  const topCats = Object.entries(catDist)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({
      id,
      count,
      name: categories.find((c: any) => c.id === id)?.name || id,
      icon: categories.find((c: any) => c.id === id)?.icon || "📋",
    }));
  const maxCount = Math.max(...topCats.map((c) => c.count), 1);

  const statCards = [
    { label: "পেন্ডিং", value: pendingCount, Icon: Activity, accent: "text-amber-500", bg: "bg-amber-500/10", urgent: pendingCount > 0 },
    { label: "অ্যাপ্রুভড", value: approvedCount, Icon: Check, accent: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "মোট ভিজিট", value: totalVisits, Icon: Eye, accent: "text-primary", bg: "bg-primary/10" },
    { label: "৭ দিনে নতুন", value: last7d, Icon: Sparkles, accent: "text-accent", bg: "bg-accent/10" },
    { label: "মোট লিংক", value: links.length, Icon: Link2, accent: "text-foreground", bg: "bg-muted" },
    { label: "ক্যাটাগরি", value: categories.length, Icon: FolderOpen, accent: "text-foreground", bg: "bg-muted" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {statCards.map(({ label, value, Icon, accent, bg, urgent }) => (
          <Card key={label} className={`relative overflow-hidden ${urgent ? "ring-2 ring-amber-500/50" : ""}`}>
            <CardContent className="p-3">
              <div className={`w-7 h-7 rounded-md ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-3.5 h-3.5 ${accent}`} />
              </div>
              <p className={`text-xl font-bold leading-tight ${accent}`}>{value.toLocaleString("bn-BD")}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-primary" /> সর্বাধিক জনপ্রিয়</CardTitle></CardHeader>
          <CardContent className="pt-0">
            {topLink ? (
              <a href={topLink.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">🏆</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{topLink.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{topLink.url}</p>
                </div>
                <Badge variant="secondary" className="text-[10px]">{(topLink.visits || 0).toLocaleString("bn-BD")} ভিজিট</Badge>
              </a>
            ) : (
              <p className="text-xs text-muted-foreground py-3 text-center">কোনো লিংক নেই</p>
            )}
            {recentPending.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                <p className="text-[11px] font-medium text-amber-600">⚠️ পেন্ডিং অপেক্ষমাণ ({recentPending.length.toLocaleString("bn-BD")})</p>
                {recentPending.map((l: any) => (
                  <div key={l.id} className="text-[11px] truncate text-muted-foreground">• {l.title}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><FolderOpen className="w-4 h-4 text-accent" /> শীর্ষ ক্যাটাগরি</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-2">
            {topCats.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 truncate"><span>{c.icon}</span><span className="truncate">{c.name}</span></span>
                  <span className="font-medium text-muted-foreground tabular-nums">{c.count.toLocaleString("bn-BD")}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
            {topCats.length === 0 && <p className="text-xs text-muted-foreground py-3 text-center">কোনো ডেটা নেই</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Admin;

