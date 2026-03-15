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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "./CategorySidebar";

const linkSchema = z.object({
  url: z.string().trim().url({ message: "সঠিক URL দিন" }).max(500),
  title: z.string().trim().min(1, { message: "শিরোনাম লিখুন" }).max(200),
  category: z.string().min(1, { message: "ক্যাটাগরি নির্বাচন করুন" }),
});

interface AddLinkDialogProps {
  categories: Category[];
  onAdd: (link: { url: string; title: string; category: string }) => void;
}

const AddLinkDialog = ({ categories, onAdd }: AddLinkDialogProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleSubmit = () => {
    const result = linkSchema.safeParse({ url, title, category });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onAdd(result.data);
    toast({
      title: "সংযুক্ত হয়েছে!",
      description: "আপনার লিংক পেন্ডিং তালিকায় যোগ হয়েছে।",
    });
    setUrl("");
    setTitle("");
    setCategory("");
    setErrors({});
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          সংযুক্ত করুন
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">নতুন লিংক সংযুক্ত করুন</DialogTitle>
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
                {categories.filter(c => c.id !== "all").map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
          </div>
          <Button onClick={handleSubmit} className="w-full">
            সংযুক্ত করুন
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddLinkDialog;
