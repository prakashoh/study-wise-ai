import React, { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../lib/api";
import { useLocation } from "react-router-dom";
import {
  MessageSquare,
  Send,
  Loader2,
  Mic,
  MicOff,
  Sparkles,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function Chat() {
  const location = useLocation();
  const state = location.state as {
    documentId?: string;
    initialQuestion?: string;
  } | null;

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [messages, setMessages] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [simplify, setSimplify] = useState(false);
  const hasAskedInitialRef = useRef(false);

  // Voice Speech API State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const askQuestion = async (q: string, docId?: string | null) => {
    if (!q.trim()) return;
    const targetDocId = docId !== undefined ? docId : (selectedDocId || null);
    const userMessage = { role: "user", content: q };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await api.sendMessage(targetDocId, q, simplify);
      setMessages(res.messages);
    } catch {
      toast.error("Failed to get response from AI Tutor.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // Load documents
  useEffect(() => {
    api.getDocuments().then((res) => {
      const readyDocs = res.filter((d) => d.status === "Ready");
      setDocuments(readyDocs);

      let activeId = "";
      if (state?.documentId) {
        activeId = state.documentId;
        setSelectedDocId(state.documentId);
      } else if (readyDocs.length > 0) {
        activeId = readyDocs[0]._id;
        setSelectedDocId(readyDocs[0]._id);
      }

      // If initial question provided, ask it automatically
      if (state?.initialQuestion && !hasAskedInitialRef.current) {
        hasAskedInitialRef.current = true;
        askQuestion(state.initialQuestion, activeId || null);
      }
    });
  }, [state]);

  // Load chat history when selected document changes
  useEffect(() => {
    setHistoryLoading(true);
    const docId = selectedDocId || null;
    api
      .getChatHistory(docId)
      .then((res) => {
        setMessages(res.messages || []);
      })
      .catch((err) => {
        console.error("Failed to load chat history:", err);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [selectedDocId]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Voice input failed. Try again.");
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuestion((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    try {
      const docId = selectedDocId || null;
      const res = await api.sendMessage(docId, currentQuestion, simplify);
      setMessages(res.messages);
    } catch (err) {
      toast.error("Failed to get response from AI Tutor.");
      // Remove temporary user message on failure
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // Simple Markdown Renderer
  const renderMarkdown = (text: string) => {
    // Basic regex replacing for headers, bolding, lists, and code
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks
    html = html.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-secondary p-3 rounded-lg text-xs overflow-x-auto my-2 border border-border"><code>$1</code></pre>',
    );

    // Headers
    html = html.replace(/### (.*?)\n/g, '<h4 class="font-bold text-sm mt-3 mb-1">$1</h4>');
    html = html.replace(/## (.*?)\n/g, '<h3 class="font-bold text-base mt-4 mb-2">$1</h3>');
    html = html.replace(/# (.*?)\n/g, '<h2 class="font-bold text-lg mt-5 mb-2">$1</h2>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>');

    // Bullet list items
    html = html.replace(/^\* (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^- (.*?)$/gm, '<li class="ml-4 list-disc">$1</li>');

    // Line breaks
    html = html.split("\n").join("<br />");

    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-1.5" />;
  };

  return (
    <AppLayout>
      <div className="h-[82vh] flex flex-col justify-between border border-border/80 bg-card rounded-3xl shadow-sm overflow-hidden animate-fade-in">
        {/* Chat Control Header */}
        <div className="border-b border-border/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-secondary/20">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary/10 text-primary border border-primary/20 rounded-xl">
              <MessageSquare className="size-4.5" />
            </span>
            <div>
              <h2 className="font-bold text-base">AI Study Tutor</h2>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                Grounded Knowledge Space
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Document Grounding Selector */}
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <BookOpen className="size-4 text-muted-foreground hidden sm:block" />
              <select
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:outline-none w-full sm:max-w-xs"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
              >
                <option value="">📚 All Notes Combined</option>
                {documents.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    📄 {doc.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Explain like I'm 5 Toggle */}
            <button
              onClick={() => setSimplify(!simplify)}
              className="flex items-center gap-1.5 border border-border rounded-xl px-3 py-1.5 bg-background text-xs font-semibold transition-colors hover:bg-secondary/40 select-none cursor-pointer"
            >
              <HelpCircle className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Explain Like I'm 5</span>
              <span className="sm:hidden">ELI5</span>
              {simplify ? (
                <ToggleRight className="size-5 text-primary fill-primary/25" />
              ) : (
                <ToggleLeft className="size-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-secondary/10">
          {historyLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-medium">
                  Loading chat history...
                </p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center space-y-5">
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm text-primary">
                <Sparkles className="size-8 fill-primary/10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base">Ask Questions About Your Notes</h3>
                <p className="text-xs text-muted-foreground">
                  Your AI Tutor answers questions grounded directly in your uploaded study materials.
                </p>
              </div>

              {/* Clickable Quick Questions */}
              <div className="w-full space-y-2 pt-2 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Suggested Questions:
                </p>
                <div className="flex flex-col gap-1.5">
                  {[
                    "🏆 Tell me about her achievements & key highlights",
                    "📋 What are the core topics and key takeaways?",
                    "🛠️ What technical skills and stack are covered?",
                    "💡 Summarize the most important details in this note",
                  ].map((sugg, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => askQuestion(sugg)}
                      className="w-full p-2.5 rounded-xl border border-border bg-card/80 hover:bg-secondary text-xs font-semibold text-foreground text-left transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span className="truncate">{sugg}</span>
                      <ArrowRight className="size-3 text-muted-foreground group-hover:text-primary shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={index}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm shadow-sm ${
                      isAssistant
                        ? "bg-card border border-border/80 text-foreground rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none shadow-glow"
                    }`}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-65 mb-1.5">
                      {isAssistant ? "StudyMate AI Tutor" : "You"}
                    </p>
                    <div className="leading-relaxed">
                      {isAssistant ? renderMarkdown(msg.content) : msg.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/80 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground font-semibold">
                  Tutor is writing response...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input box */}
        <form
          onSubmit={handleSend}
          className="border-t border-border/80 px-6 py-4 flex items-center gap-3 bg-secondary/10"
        >
          <div className="relative flex-1">
            <input
              type="text"
              disabled={loading}
              className="w-full rounded-2xl border border-border bg-background pl-4 pr-12 py-3.5 text-sm transition-colors focus:border-primary focus:outline-none shadow-sm disabled:opacity-50"
              placeholder="Ask anything from your uploaded materials..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            {/* Mic voice input */}
            <button
              type="button"
              onClick={toggleListening}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg border transition-colors select-none ${
                isListening
                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  : "bg-background text-muted-foreground border-border hover:bg-secondary"
              }`}
              title={isListening ? "Stop listening" : "Ask via voice"}
            >
              {isListening ? (
                <MicOff className="size-4 animate-pulse" />
              ) : (
                <Mic className="size-4" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="p-3.5 rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send className="size-4.5" />
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
