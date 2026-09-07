import { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../lib/api";
import { useLocation } from "react-router-dom";
import {
  FileText,
  Sparkles,
  Printer,
  BookOpen,
  Loader2,
  Bookmark,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function Summarizer() {
  const location = useLocation();
  const state = location.state as { documentId?: string } | null;

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  const [length, setLength] = useState<"short" | "medium" | "detailed">("medium");
  const [summary, setSummary] = useState("");
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getDocuments().then((res) => {
      const readyDocs = res.filter((d) => d.status === "Ready");
      setDocuments(readyDocs);

      if (state?.documentId) {
        setSelectedDocId(state.documentId);
      } else if (readyDocs.length > 0) {
        setSelectedDocId(readyDocs[0]._id);
      }
    });
  }, [state]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadedFileName(file.name);
    try {
      const res = await api.uploadDocument(file);
      const newDoc = res.document;

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedDocId(newDoc._id);
      toast.success(`"${file.name}" uploaded and selected!`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to upload file.");
      setUploadedFileName("");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSummarize = async () => {
    if (!selectedDocId) {
      toast.error("Please select a document.");
      return;
    }

    setGenerating(true);
    setSummary("");
    try {
      const res = await api.getSummary(selectedDocId, length);
      setSummary(res.summary);
      toast.success("Summary generated successfully!");
    } catch (err) {
      toast.error("Failed to generate summary.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("summary-content")?.innerHTML;
    const docTitle =
      documents.find((d) => d._id === selectedDocId)?.title || "Summary";

    if (!printContent) return;

    const windowUrl = "about:blank";
    const uniqueName = new Date().getTime();
    const printWindow = window.open(windowUrl, uniqueName.toString(), "left=50000,top=50000,width=0,height=0");
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${docTitle} - Summary</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
              h1, h2, h3, h4 { color: #4F46E5; }
              pre { background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 13px; }
              li { margin-left: 20px; }
            </style>
          </head>
          <body>
            <h1>StudyMate AI Summary</h1>
            <h2>Document: ${docTitle}</h2>
            <hr />
            <div>${printContent}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Simple Markdown Renderer
  const renderMarkdown = (text: string) => {
    const cleanText = text.replace(/\r\n/g, "\n");
    let html = cleanText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks
    html = html.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-secondary p-4 rounded-xl text-xs overflow-x-auto my-3 border border-border"><code>$1</code></pre>',
    );

    // Headers
    html = html.replace(
      /### (.*?)(?:\n|$)/g,
      '<h4 class="font-bold text-base mt-4 mb-2 text-foreground">$1</h4>',
    );
    html = html.replace(
      /## (.*?)(?:\n|$)/g,
      '<h3 class="font-bold text-lg mt-5 mb-2.5 text-foreground border-b border-border pb-1">$1</h3>',
    );
    html = html.replace(
      /# (.*?)(?:\n|$)/g,
      '<h2 class="font-bold text-2xl mt-6 mb-3 text-primary border-b border-border pb-2">$1</h2>',
    );

    // Bold
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold text-foreground">$1</strong>',
    );

    // Bullet lists
    html = html.replace(
      /^\* (.*?)$/gm,
      '<li class="ml-4 list-disc my-1 leading-relaxed">$1</li>',
    );
    html = html.replace(
      /^- (.*?)$/gm,
      '<li class="ml-4 list-disc my-1 leading-relaxed">$1</li>',
    );

    // Line breaks
    html = html.split("\n").join("<br />");

    return (
      <div
        id="summary-content"
        dangerouslySetInnerHTML={{ __html: html }}
        className="space-y-3 text-sm leading-relaxed text-foreground/90"
      />
    );
  };

  const selectedDoc = documents.find((d) => d._id === selectedDocId);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              AI Summary Generator
            </h1>
            <p className="text-muted-foreground mt-1">
              Condense textbook chapters or lecture notes into structured study sheets.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- CONTROLS --- */}
          <div className="lg:col-span-1 bg-card border border-border/80 rounded-3xl p-6 shadow-sm h-fit space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="size-4.5 text-primary" />
              Configure Summary
            </h3>

            <div className="space-y-5">
              {/* Doc Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="size-3.5" />
                    Select Document
                  </label>
                  {documents.length > 0 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {documents.length} available
                    </span>
                  )}
                </div>

                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold focus:outline-none"
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                >
                  <option value="" disabled>
                    Choose notes...
                  </option>
                  {documents.map((doc) => (
                    <option key={doc._id} value={doc._id}>
                      {doc.title}
                    </option>
                  ))}
                </select>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-border/70"></div>
                  <span className="flex-shrink mx-2 text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                    or upload notes
                  </span>
                  <div className="flex-grow border-t border-border/70"></div>
                </div>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx,.doc"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Choose File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span className="truncate">Uploading {uploadedFileName}...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="size-3.5" />
                      <span>Choose File (PDF, TXT, DOCX)</span>
                    </>
                  )}
                </button>

                {selectedDoc && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/60 border border-border text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-3.5 text-primary shrink-0" />
                      <span className="font-semibold text-foreground truncate">
                        {selectedDoc.title}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="size-3" /> Ready
                    </span>
                  </div>
                )}
              </div>

              {/* Length Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Bookmark className="size-3.5" />
                  Summary Length
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["short", "medium", "detailed"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLength(l)}
                      className={`rounded-xl py-2 text-xs font-bold border capitalize transition-all select-none cursor-pointer ${
                        length === l
                          ? "bg-primary text-primary-foreground border-primary shadow-glow"
                          : "bg-secondary/40 text-muted-foreground border-border hover:bg-secondary"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSummarize}
                disabled={generating || !selectedDocId}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="size-4.5" />
                    Summarize Notes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* --- DISPLAY AREA --- */}
          <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-6 shadow-sm min-h-[50vh] flex flex-col">
            {summary ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-border pb-4 bg-secondary/10 -mx-6 -mt-6 p-6 rounded-t-3xl">
                  <div>
                    <h3 className="font-bold text-lg text-foreground truncate max-w-sm sm:max-w-md">
                      Summary: {selectedDoc?.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Length: {length}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground shadow-sm transition-colors"
                      title="Export PDF / Print"
                    >
                      <Printer className="size-4.5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 text-sm leading-relaxed text-foreground/90 overflow-y-auto px-1">
                  {renderMarkdown(summary)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center m-auto text-center max-w-sm">
                <div className="p-4 bg-secondary/40 border border-border/40 rounded-2xl text-muted-foreground mb-4">
                  <FileText className="size-10 text-primary" />
                </div>
                <h3 className="font-bold text-base">Generate a Summary</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Select an uploaded document on the left and configure your preferences to generate key summaries.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
