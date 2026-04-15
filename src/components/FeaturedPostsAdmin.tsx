import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  useFeaturedPosts, useAddFeaturedPost, useUpdateFeaturedPost, useDeleteFeaturedPost,
} from "@/hooks/useCountries";
import { Plus, Trash2, Edit, ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

const FeaturedPostsAdmin = () => {
  const { toast } = useToast();
  const { data: posts = [] } = useFeaturedPosts();
  const addPost = useAddFeaturedPost();
  const updatePost = useUpdateFeaturedPost();
  const deletePost = useDeleteFeaturedPost();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sourceName, setSourceName] = useState("");

  const handleAdd = () => {
    if (!title || !url) return;
    addPost.mutate(
      { title, url, image_url: imageUrl || null, description: description || null, source_name: sourceName || null },
      {
        onSuccess: () => {
          toast({ title: "ফিচার পোস্ট যোগ হয়েছে ✅" });
          setTitle(""); setUrl(""); setImageUrl(""); setDescription(""); setSourceName("");
          setOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> নতুন ফিচার পোস্ট
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ফিচার পোস্ট যোগ</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="শিরোনাম *" />
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL *" className="font-mono text-xs" />
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="ছবি URL (ঐচ্ছিক)" />
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="বিবরণ (ঐচ্ছিক)" />
            <Input value={sourceName} onChange={(e) => setSourceName(e.target.value)} placeholder="সোর্স নাম (ঐচ্ছিক)" />
            <Button className="w-full" onClick={handleAdd}>যোগ করুন</Button>
          </div>
        </DialogContent>
      </Dialog>

      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-4 flex items-center gap-3">
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-12 h-9 rounded object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{post.title}</p>
              <p className="text-xs text-muted-foreground truncate">{post.url}</p>
            </div>
            <Switch
              checked={post.is_active}
              onCheckedChange={(checked) => {
                updatePost.mutate({ id: post.id, is_active: checked });
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
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
            কোনো ফিচার পোস্ট নেই
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeaturedPostsAdmin;
