import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import type { CategoryRow } from "@/hooks/useLinks";

interface BulkImportDialogProps {
  categories: CategoryRow[];
}

interface ImportLink {
  title: string;
  url: string;
  category_id?: string;
}

const BulkImportDialog = ({ categories }: BulkImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState("");
  const [parsedLinks, setParsedLinks] = useState<ImportLink[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const parseCSV = (text: string): ImportLink[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
    const titleIdx = header.findIndex((h) => ["title", "name", "শিরোনাম"].includes(h));
    const urlIdx = header.findIndex((h) => ["url", "link", "website", "লিংক"].includes(h));
    const catIdx = header.findIndex((h) => ["category", "category_id", "ক্যাটাগরি"].includes(h));

    if (titleIdx === -1 || urlIdx === -1) {
      setError("CSV ফাইলে 'title' ও 'url' কলাম থাকতে হবে।");
      return [];
    }

    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        title: cols[titleIdx] || "",
        url: cols[urlIdx] || "",
        category_id: catIdx >= 0 ? cols[catIdx] : undefined,
      };
    }).filter((l) => l.title && l.url && l.url.startsWith("http"));
  };

  const parseJSON = (text: string): ImportLink[] => {
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : data.links || data.data || [];
      return arr
        .map((item: any) => ({
          title: item.title || item.name || "",
          url: item.url || item.link || item.website || "",
          category_id: item.category_id || item.category || undefined,
        }))
        .filter((l: ImportLink) => l.title && l.url && l.url.startsWith("http"));
    } catch {
      setError("JSON ফাইল পার্স করা যায়নি।");
      return [];
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setParsedLinks([]);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      let links: ImportLink[];
      if (file.name.endsWith(".csv")) {
        links = parseCSV(text);
      } else if (file.name.endsWith(".json")) {
        links = parseJSON(text);
      } else {
        setError("শুধুমাত্র .csv বা .json ফাইল সাপোর্টেড।");
        return;
      }
      setParsedLinks(links);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!defaultCategory && parsedLinks.some((l) => !l.category_id)) {
      setError("ক্যাটাগরি নির্বাচন করুন।");
      return;
    }

    setImporting(true);
    setProgress({ done: 0, total: parsedLinks.length });

    const batchSize = 50;
    let done = 0;
    let errors = 0;

    for (let i = 0; i < parsedLinks.length; i += batchSize) {
      const batch = parsedLinks.slice(i, i + batchSize).map((l) => ({
        title: l.title.slice(0, 255),
        url: l.url.slice(0, 2000),
        category_id: l.category_id || defaultCategory,
        status: "approved" as const,
        visits: 0,
      }));

      const { error } = await supabase.from("links").insert(batch);
      if (error) errors++;
      done += batch.length;
      setProgress({ done, total: parsedLinks.length });
    }

    setImporting(false);
    qc.invalidateQueries({ queryKey: ["admin-links"] });
    qc.invalidateQueries({ queryKey: ["links"] });
    qc.invalidateQueries({ queryKey: ["all-links"] });

    if (errors === 0) {
      toast({ title: `${parsedLinks.length} টি লিংক সফলভাবে ইমপোর্ট হয়েছে ✅` });
      setParsedLinks([]);
      setOpen(false);
    } else {
      toast({ title: "কিছু লিংক ইমপোর্ট করতে সমস্যা হয়েছে", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setParsedLinks([]); setError(""); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Upload className="w-4 h-4" /> বাল্ক ইমপোর্ট
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>বাল্ক ইমপোর্ট (CSV / JSON)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <FileSpreadsheet className="w-8 h-8" />
              <FileJson className="w-8 h-8" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              CSV বা JSON ফাইল আপলোড করুন
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              CSV: title, url, category_id কলাম | JSON: [{`{title, url}`}]
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {parsedLinks.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                {parsedLinks.length} টি লিংক পাওয়া গেছে
              </div>

              <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="ডিফল্ট ক্যাটাগরি নির্বাচন করুন" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                className="w-full gap-2"
                onClick={handleImport}
                disabled={importing}
              >
                <Upload className="w-4 h-4" />
                {importing
                  ? `ইমপোর্ট হচ্ছে... (${progress.done}/${progress.total})`
                  : `${parsedLinks.length} টি লিংক ইমপোর্ট করুন`}
              </Button>
            </>
          )}

          <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
            <p className="font-medium">ফরম্যাট গাইড:</p>
            <p>CSV: <code className="bg-muted px-1 rounded">title,url,category_id</code></p>
            <p>JSON: <code className="bg-muted px-1 rounded">[{`{"title":"...", "url":"..."}`}]</code></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
