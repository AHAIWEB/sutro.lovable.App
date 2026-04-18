import { useState } from "react";
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
import { Plus, Send, Wand2, Loader2 } from "lucide-react";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(false);
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
        body: { url: url.trim(), mode: "single" },
      });
      if (error) throw error;
      const meta = data?.metadata || (data?.items?.[0]) || data;
      if (meta?.title) {
        setTitle(meta.title);
        toast({ title: "তথ্য পেয়েছি ✅", description: "শিরোনাম স্বয়ংক্রিয়ভাবে যোগ করা হলো" });
      } else {
        toast({ title: "তথ্য পাওয়া যায়নি", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "ফেচ ব্যর্থ", description: e.message, variant: "destructive" });
    } finally {
      setFetching(false);
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
      });
      toast({
        title: "সংযুক্ত হয়েছে! ✅",
        description: "আপনার লিংক পর্যালোচনার জন্য জমা হয়েছে।",
      });
      setUrl("");
      setTitle("");
      setCategory("");
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">নতুন সাইট জমা দিন</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            পর্যালোচনার পর আপনার সাইট যুক্ত হবে
          </p>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="font-mono text-sm"
            />
            {errors.url && <p className="text-xs text-destructive mt-1">{errors.url}</p>}
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
