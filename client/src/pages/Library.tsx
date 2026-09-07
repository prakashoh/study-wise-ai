import React, { useState, useEffect } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../lib/api";
import {
  Upload,
  BookOpen,
  Trash2,
  Search,
  Loader2,
  MessageSquare,
  FileText,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Library() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [lastUploadedDoc, setLastUploadedDoc] = useState<any | null>(null);
  const [quickQuestion, setQuickQuestion] = useState<Record<string, string>>({});

  // Form State
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [file, setFile] = useState<File | null>(null);

  const navigate = useNavigate();

  const fetchDocuments = () => {
    api
      .getDocuments()
      .then((res) => {
        setDocuments(res);
      })
      .catch(() => {
        toast.error("Failed to load documents.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDocuments();

    // Set up polling for documents that are processing
    const interval = setInterval(() => {
      api.getDocuments().then((res) => {
        // If there is any processing doc, update list
        setDocuments(res);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        // Strip extension for title preview
        const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadDocument(file, title, subject);
      if (res?.document) {
        setLastUploadedDoc(res.document);
      }
      toast.success("Document uploaded successfully! AI Tutor is ready to answer questions.");
      // Reset form
      setFile(null);
      setTitle("");
      setSubject("General");
      // Re-fetch
      fetchDocuments();
    } catch (err) {
      toast.error((err as Error).message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document? This will remove all AI chat history, quizzes, and flashcards associated with it.")) {
      return;
    }

    try {
      await api.deleteDocument(id);
      toast.success("Document deleted successfully.");
      setDocuments(documents.filter((d) => d._id !== id));
    } catch (err) {
      toast.error("Failed to delete document.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Extract unique subjects for filtering
  const subjects = [
    "All",
    ...Array.from(new Set(documents.map((d) => d.subject))),
  ];

  // Filter list
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "All" || doc.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Study Library
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload and organize notes, PDFs, or slides to tutor your AI workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- UPLOAD SECTION --- */}
          <div className="lg:col-span-1 bg-card border border-border/80 rounded-3xl p-6 shadow-sm h-fit space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Upload className="size-4.5 text-primary" />
              Upload Document
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-6 text-center cursor-pointer transition-colors relative bg-secondary/10">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  required
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={handleFileChange}
                />
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <span className="p-3 bg-card border border-border rounded-xl text-muted-foreground shadow-sm">
                      <BookOpen className="size-6 text-primary" />
                    </span>
                  </div>
                  {file ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold truncate px-2">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatSize(file.size)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Select a file or drag here
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports PDF and TXT up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none"
                  placeholder="e.g. Chemistry Lecture 3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Subject Tag Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Subject Label
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none"
                  placeholder="e.g. Science, Math, History"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Uploading & Parsing...
                  </>
                ) : (
                  <>
                    Upload Notes
                  </>
                )}
              </button>
            </form>
          </div>

          {/* --- LIBRARY DIRECTORY --- */}
          <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6">
            {/* Upload Success Quick Action Banner */}
            {lastUploadedDoc && (
              <div className="bg-gradient-brand text-primary-foreground p-6 rounded-3xl shadow-glow space-y-3 animate-fade-in border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-base sm:text-lg">
                    <Sparkles className="size-5" /> "{lastUploadedDoc.title}" is Uploaded & Ready!
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastUploadedDoc(null)}
                    className="p-1 rounded-lg hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <p className="text-xs opacity-90 max-w-xl">
                  AI has parsed and grounded your document. You can now ask questions about it, generate summaries, quizzes, or flashcards.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    onClick={() =>
                      navigate("/chat", {
                        state: { documentId: lastUploadedDoc._id },
                      })
                    }
                    className="px-4 py-2.5 bg-white text-primary rounded-xl font-bold text-xs shadow-sm hover:bg-white/90 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <MessageSquare className="size-4" /> Ask Questions About Notes
                  </button>
                  <button
                    onClick={() =>
                      navigate("/summarizer", {
                        state: { documentId: lastUploadedDoc._id },
                      })
                    }
                    className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <FileText className="size-4" /> Summarize
                  </button>
                  <button
                    onClick={() =>
                      navigate("/quizzes", {
                        state: { documentId: lastUploadedDoc._id },
                      })
                    }
                    className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Award className="size-4" /> Generate Quiz
                  </button>
                  <button
                    onClick={() =>
                      navigate("/flashcards", {
                        state: { documentId: lastUploadedDoc._id },
                      })
                    }
                    className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Layers className="size-4" /> Study Flashcards
                  </button>
                </div>
              </div>
            )}

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`rounded-full px-4 py-1 text-xs font-semibold border transition-all ${
                      selectedSubject === sub
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground font-semibold">
                    Loading your study documents...
                  </p>
                </div>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl bg-secondary/10">
                <BookOpen className="size-12 text-muted-foreground/60 mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No documents found
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  Upload a PDF or TXT note on the left to start.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc._id}
                    className="border border-border/70 rounded-2xl p-5 hover:border-primary/30 hover:shadow-card transition-all flex flex-col gap-4 bg-secondary/10"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold">
                            {doc.subject}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString()} •{" "}
                            {formatSize(doc.fileSize)}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-foreground truncate">
                          {doc.title}
                        </h3>
                        {doc.status === "Processing" && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                            <Loader2 className="size-3.5 animate-spin" />
                            Extracting text chunks...
                          </span>
                        )}
                        {doc.status === "Ready" && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-500 font-semibold">
                            <Sparkles className="size-3.5 fill-emerald-500" />
                            Trained & Ready
                          </span>
                        )}
                        {doc.status === "Failed" && (
                          <span className="text-xs text-destructive font-semibold">
                            Parsing error. Try re-uploading.
                          </span>
                        )}
                      </div>

                      {/* Action Hub */}
                      <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                        <button
                          onClick={() =>
                            navigate("/chat", { state: { documentId: doc._id } })
                          }
                          disabled={doc.status !== "Ready"}
                          className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-glow flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer disabled:opacity-40"
                          title="Ask questions about this note"
                        >
                          <MessageSquare className="size-3.5" />
                          Ask Questions
                        </button>

                        <button
                          onClick={() =>
                            navigate("/summarizer", {
                              state: { documentId: doc._id },
                            })
                          }
                          disabled={doc.status !== "Ready"}
                          className="p-2 rounded-xl bg-card border border-border/70 text-muted-foreground hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-colors disabled:opacity-40 cursor-pointer"
                          title="Generate Summary"
                        >
                          <FileText className="size-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate("/quizzes", {
                              state: { documentId: doc._id },
                            })
                          }
                          disabled={doc.status !== "Ready"}
                          className="p-2 rounded-xl bg-card border border-border/70 text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-colors disabled:opacity-40 cursor-pointer"
                          title="Build MCQ Quiz"
                        >
                          <Award className="size-4" />
                        </button>

                        <button
                          onClick={() =>
                            navigate("/flashcards", {
                              state: { documentId: doc._id },
                            })
                          }
                          disabled={doc.status !== "Ready"}
                          className="p-2 rounded-xl bg-card border border-border/70 text-muted-foreground hover:text-amber-500 hover:border-amber-500/20 hover:bg-amber-500/5 transition-colors disabled:opacity-40 cursor-pointer"
                          title="Assemble Flashcards"
                        >
                          <Layers className="size-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="p-2 rounded-xl bg-card border border-border/70 text-muted-foreground hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5 transition-colors cursor-pointer"
                          title="Delete notes"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Quick-Ask Bar on every document card */}
                    {doc.status === "Ready" && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const q = quickQuestion[doc._id]?.trim();
                          if (!q) return;
                          navigate("/chat", {
                            state: {
                              documentId: doc._id,
                              initialQuestion: q,
                            },
                          });
                        }}
                        className="flex items-center gap-2 pt-2 border-t border-border/60"
                      >
                        <input
                          type="text"
                          placeholder={`Ask a question about "${doc.title}"... (e.g. tell me about her achievements)`}
                          value={quickQuestion[doc._id] || ""}
                          onChange={(e) =>
                            setQuickQuestion({
                              ...quickQuestion,
                              [doc._id]: e.target.value,
                            })
                          }
                          className="flex-1 text-xs rounded-xl border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 font-medium"
                        />
                        <button
                          type="submit"
                          disabled={!quickQuestion[doc._id]?.trim()}
                          className="px-3 py-2 bg-gradient-brand text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
                        >
                          Ask AI <ArrowRight className="size-3" />
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
