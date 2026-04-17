import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import * as XLSX from "xlsx";
import type { CategoryRow } from "@/hooks/useLinks";

interface BulkImportDialogProps {
  categories: CategoryRow[];
}

interface ImportLink {
  title: string;
  url: string;
  category_id?: string;
  favicon?: string;
}

type Step = "upload" | "map" | "import";

const FIELD_HINTS = {
  title: ["title", "name", "শিরোনাম", "নাম", "site"],
  url: ["url", "link", "website", "লিংক", "href", "address"],
  category: ["category", "category_id", "ক্যাটাগরি", "cat", "type", "section"],
  favicon: ["favicon", "logo", "icon", "image", "img", "লোগো"],
};

const guessColumn = (cols: string[], hints: string[]) =>
  cols.findIndex((c) => hints.some((h) => c.toLowerCase().trim() === h.toLowerCase())) >= 0
    ? cols.findIndex((c) => hints.some((h) => c.toLowerCase().trim() === h.toLowerCase()))
    : cols.findIndex((c) => hints.some((h) => c.toLowerCase().includes(h.toLowerCase())));

const BulkImportDialog = ({ categories }: BulkImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ title: string; url: string; category: string; favicon: string }>({
    title: "", url: "", category: "", favicon: "",
  });
  const [parsedLinks, setParsedLinks] = useState<ImportLink[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const reset = () => {
    setStep("upload"); setRawRows([]); setColumns([]);
    setMapping({ title: "", url: "", category: "", favicon: "" });
    setParsedLinks([]); setError(""); setDefaultCategory("");
  };

  const parseFile = async (file: File) => {
    setError("");
    try {
      let rows: any[] = [];
      const ext = file.name.toLowerCase().split(".").pop();

      if (ext === "json") {
        const text = await file.text();
        const data = JSON.parse(text);
        rows = Array.isArray(data) ? data : data.links || data.data || data.items || [];
        if (rows.length === 0) throw new Error("JSON ফাইল খালি বা অজানা ফরম্যাট");
      } else if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        const wb = XLSX.read(text, { type: "string" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      } else {
        throw new Error("ফাইল ফরম্যাট সাপোর্টেড না। CSV/JSON/XLSX/XLS ব্যবহার করুন।");
      }

      if (rows.length === 0) throw new Error("কোনো ডাটা পাওয়া যায়নি");

      const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
      setColumns(cols);
      setRawRows(rows);

      // Auto-guess mapping
      const tIdx = guessColumn(cols, FIELD_HINTS.title);
      const uIdx = guessColumn(cols, FIELD_HINTS.url);
      const cIdx = guessColumn(cols, FIELD_HINTS.category);
      const fIdx = guessColumn(cols, FIELD_HINTS.favicon);

      setMapping({
        title: tIdx >= 0 ? cols[tIdx] : "",
        url: uIdx >= 0 ? cols[uIdx] : "",
        category: cIdx >= 0 ? cols[cIdx] : "",
        favicon: fIdx >= 0 ? cols[fIdx] : "",
      });
      setStep("map");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    parseFile(file);
  };

  const previewLinks = useMemo<ImportLink[]>(() => {
    if (!mapping.title || !mapping.url) return [];
    return rawRows
      .map((r) => ({
        title: String(r[mapping.title] || "").trim(),
        url: String(r[mapping.url] || "").trim(),
        category_id: mapping.category ? String(r[mapping.category] || "").trim() || undefined : undefined,
        favicon: mapping.favicon ? String(r[mapping.favicon] || "").trim() || undefined : undefined,
      }))
      .filter((l) => l.title && l.url && /^https?:\/\//i.test(l.url));
  }, [rawRows, mapping]);

  const proceedToImport = () => {
    setError("");
    if (!mapping.title || !mapping.url) {
      setError("শিরোনাম ও URL কলাম ম্যাপ করুন।");
      return;
    }
    if (previewLinks.length === 0) {
      setError("বৈধ কোনো লিংক পাওয়া যায়নি (https দিয়ে শুরু হতে হবে)।");
      return;
    }
    setParsedLinks(previewLinks);
    setStep("import");
  };

  const handleImport = async () => {
    if (!defaultCategory && parsedLinks.some((l) => !l.category_id || !categories.find((c) => c.id === l.category_id))) {
      setError("ডিফল্ট ক্যাটাগরি নির্বাচন করুন (CSV-তে ক্যাটাগরি ম্যাপ না থাকলে)।");
      return;
    }

    setImporting(true);
    setProgress({ done: 0, total: parsedLinks.length });

    const batchSize = 100;
    let done = 0, errors = 0;

    for (let i = 0; i < parsedLinks.length; i += batchSize) {
      const batch = parsedLinks.slice(i, i + batchSize).map((l) => {
        let favicon = l.favicon;
        if (!favicon) {
          try { favicon = `https://www.google.com/s2/favicons?domain=${new URL(l.url).hostname}&sz=64`; } catch {}
        }
        const catId = l.category_id && categories.find((c) => c.id === l.category_id) ? l.category_id : defaultCategory;
        return {
          title: l.title.slice(0, 255),
          url: l.url.slice(0, 2000),
          category_id: catId,
          favicon: favicon || null,
          status: "approved" as const,
          visits: 0,
        };
      });

      const { error } = await supabase.from("links").insert(batch);
      if (error) { errors++; console.error(error); }
      done += batch.length;
      setProgress({ done, total: parsedLinks.length });
    }

    setImporting(false);
    qc.invalidateQueries({ queryKey: ["admin-links"] });
    qc.invalidateQueries({ queryKey: ["links"] });
    qc.invalidateQueries({ queryKey: ["all-links"] });

    if (errors === 0) {
      toast({ title: `${parsedLinks.length} টি লিংক সফলভাবে ইমপোর্ট হয়েছে ✅` });
      reset();
      setOpen(false);
    } else {
      toast({ title: "কিছু লিংক ইমপোর্টে সমস্যা হয়েছে", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Upload className="w-4 h-4" /> বাল্ক ইমপোর্ট
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>বাল্ক ইমপোর্ট ({step === "upload" ? "১/৩ ফাইল" : step === "map" ? "২/৩ কলাম ম্যাপিং" : "৩/৩ ইমপোর্ট"})</DialogTitle>
        </DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <FileSpreadsheet className="w-10 h-10" />
                <FileJson className="w-10 h-10" />
              </div>
              <p className="mt-3 font-medium text-sm text-foreground">CSV / Excel / JSON ফাইল আপলোড করুন</p>
              <p className="text-xs text-muted-foreground mt-1">.csv, .xlsx, .xls, .json সাপোর্টেড</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json,.xlsx,.xls,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
              <p className="font-medium text-foreground">সাপোর্টেড কলাম (যেকোনো নামে):</p>
              <p>• <strong>title/name/শিরোনাম</strong> — সাইটের নাম</p>
              <p>• <strong>url/link/website/লিংক</strong> — URL (https দিয়ে শুরু)</p>
              <p>• <strong>category/ক্যাটাগরি</strong> — ক্যাটাগরি ID (ঐচ্ছিক)</p>
              <p>• <strong>favicon/logo/icon</strong> — লোগো URL (ঐচ্ছিক, না দিলে অটো-জেনারেট হবে)</p>
            </div>
          </div>
        )}

        {/* STEP 2: MAPPING WIZARD */}
        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>{rawRows.length} টি সারি পাওয়া গেছে — কলাম ম্যাপ করুন</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MappingField label="শিরোনাম *" value={mapping.title} columns={columns} onChange={(v) => setMapping({ ...mapping, title: v })} />
              <MappingField label="URL *" value={mapping.url} columns={columns} onChange={(v) => setMapping({ ...mapping, url: v })} />
              <MappingField label="ক্যাটাগরি ID" value={mapping.category} columns={columns} onChange={(v) => setMapping({ ...mapping, category: v })} />
              <MappingField label="লোগো / Favicon URL" value={mapping.favicon} columns={columns} onChange={(v) => setMapping({ ...mapping, favicon: v })} />
            </div>

            {/* Preview */}
            <div className="border border-border rounded-lg p-3 bg-muted/20">
              <p className="text-xs font-medium mb-2">প্রিভিউ ({previewLinks.length} টি বৈধ):</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {previewLinks.slice(0, 5).map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-1.5 bg-background rounded">
                    {l.favicon && <img src={l.favicon} alt="" className="w-4 h-4 rounded" onError={(e) => (e.currentTarget.style.display = "none")} />}
                    <span className="font-medium truncate flex-1">{l.title}</span>
                    <span className="text-muted-foreground truncate text-[10px] max-w-[200px]">{l.url}</span>
                  </div>
                ))}
                {previewLinks.length > 5 && (
                  <p className="text-[10px] text-muted-foreground text-center pt-1">...আরও {previewLinks.length - 5} টি</p>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">ফাইল বদলাও</Button>
              <Button onClick={proceedToImport} className="flex-1 gap-1.5" disabled={!mapping.title || !mapping.url || previewLinks.length === 0}>
                পরবর্তী <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: IMPORT */}
        {step === "import" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>{parsedLinks.length} টি লিংক ইমপোর্টের জন্য প্রস্তুত</span>
            </div>

            <div>
              <Label className="text-xs">ডিফল্ট ক্যাটাগরি (CSV-তে category না থাকলে এটি ব্যবহৃত হবে)</Label>
              <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                <SelectTrigger><SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("map")} disabled={importing} className="flex-1">পেছনে</Button>
              <Button className="flex-1 gap-2" onClick={handleImport} disabled={importing}>
                <Upload className="w-4 h-4" />
                {importing ? `ইমপোর্ট হচ্ছে... (${progress.done}/${progress.total})` : `${parsedLinks.length} টি ইমপোর্ট করুন`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function MappingField({ label, value, columns, onChange }: { label: string; value: string; columns: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
        <SelectTrigger><SelectValue placeholder="কলাম নির্বাচন করুন" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— কোনোটিই না —</SelectItem>
          {columns.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default BulkImportDialog;
