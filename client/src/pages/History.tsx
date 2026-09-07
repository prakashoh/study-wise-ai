import React, { useState } from "react";
import AppLayout from "../components/AppLayout";
import {
  Clock,
  MessageSquare,
  Award,
  FileText,
  Layers,
  Search,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  type: "chat" | "quiz" | "document" | "flashcard";
  title: string;
  subtitle: string;
  date: string;
  score?: string;
  xpEarned: number;
  tag: string;
  link: string;
}

export default function History() {
  const [filterType, setFilterType] = useState<"all" | "chat" | "quiz" | "document">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([
    {
      id: "1",
      type: "chat",
      title: "Newton's Second Law Simple Explanation & Example",
      subtitle: "Asked AI Tutor about F = m × a and shopping cart real-world physics analogy.",
      date: "Today, 10:24 AM",
      xpEarned: 10,
      tag: "Physics",
      link: "/dashboard",
    },
    {
      id: "2",
      type: "quiz",
      title: "Newton's Laws of Motion Quick Quiz Attempt",
      subtitle: "Scored 100% on force and acceleration multiple-choice benchmark questions.",
      date: "Today, 10:45 AM",
      score: "100%",
      xpEarned: 30,
      tag: "Quick Quiz",
      link: "/quizzes",
    },
    {
      id: "3",
      type: "document",
      title: "Newton's Laws of Motion.pdf",
      subtitle: "Extracted 12 pages of lecture notes, formulas, and inertia concepts.",
      date: "Today, 9:50 AM",
      xpEarned: 50,
      tag: "Document Upload",
      link: "/library",
    },
    {
      id: "4",
      type: "chat",
      title: "Derivation of Kinetic Energy from Work-Energy Theorem",
      subtitle: "Explored integral of force with respect to distance W = ΔKE.",
      date: "Yesterday, 4:15 PM",
      xpEarned: 10,
      tag: "Calculus",
      link: "/chat",
    },
    {
      id: "5",
      type: "flashcard",
      title: "Classical Mechanics Formula Deck Review",
      subtitle: "Mastered 8 cards on momentum, kinetic energy, impulse, and power.",
      date: "Yesterday, 2:30 PM",
      xpEarned: 20,
      tag: "Flashcards",
      link: "/flashcards",
    },
    {
      id: "6",
      type: "quiz",
      title: "Calculus Limits & Continuity Evaluation",
      subtitle: "Practiced 5 AI-generated questions with full step-by-step explanations.",
      date: "Sep 01, 2026",
      score: "80%",
      xpEarned: 25,
      tag: "Mathematics",
      link: "/quizzes",
    },
    {
      id: "7",
      type: "document",
      title: "Tap_Earn_Page_task_Full_Stack.pdf",
      subtitle: "Parsed specification document for full stack study review.",
      date: "Aug 30, 2026",
      xpEarned: 50,
      tag: "Document Upload",
      link: "/library",
    },
  ]);

  // Filtered items
  const filteredList = historyItems.filter((item) => {
    const matchesFilter = filterType === "all" || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const clearItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHistoryItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item removed from activity history.");
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear your activity history?")) {
      setHistoryItems([]);
      toast.success("Activity history cleared.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Clock className="size-7 text-indigo-600" />
              Learning & Activity History
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              Review and resume past AI conversations, quiz performances, and uploaded notes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {historyItems.length > 0 && (
              <button
                onClick={clearAllHistory}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                Clear History
              </button>
            )}
          </div>
        </div>

        {/* --- SUMMARY METRICS STATS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Sessions
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{historyItems.length}</p>
            </div>
            <div className="size-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Clock className="size-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                AI Q&A Chats
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {historyItems.filter((i) => i.type === "chat").length}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <MessageSquare className="size-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quizzes Taken
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {historyItems.filter((i) => i.type === "quiz").length}
              </p>
            </div>
            <div className="size-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Award className="size-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                XP Earned
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-0.5">
                +{historyItems.reduce((acc, i) => acc + i.xpEarned, 0)} XP
              </p>
            </div>
            <div className="size-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Sparkles className="size-5 fill-amber-300" />
            </div>
          </div>
        </div>

        {/* --- SEARCH & CATEGORY FILTER TABS --- */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: "all", label: "All Activity" },
              { id: "chat", label: "AI Chats" },
              { id: "quiz", label: "Quiz Scores" },
              { id: "document", label: "Documents" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  filterType === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search past questions or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* --- HISTORY TIMELINE CARDS --- */}
        <div className="space-y-3">
          {filteredList.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Clock className="size-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">No activity found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No history matching your current filter. Ask questions in the AI workspace or complete a quiz to log your study sessions!
              </p>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs"
              >
                Go to AI Workspace
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ) : (
            filteredList.map((item) => {
              const Icon =
                item.type === "chat"
                  ? MessageSquare
                  : item.type === "quiz"
                    ? Award
                    : item.type === "document"
                      ? FileText
                      : Layers;

              const badgeColor =
                item.type === "chat"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : item.type === "quiz"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : item.type === "document"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200";

              return (
                <Link
                  key={item.id}
                  to={item.link}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-3.5">
                    <span className={`p-2.5 rounded-xl border shrink-0 ${badgeColor}`}>
                      <Icon className="size-5" />
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                          {item.tag}
                        </span>
                        {item.score && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Score: {item.score}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl font-normal">
                        {item.subtitle}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5 font-medium">
                        <span>{item.date}</span>
                        <span>•</span>
                        <span className="text-indigo-600 font-semibold">+{item.xpEarned} XP</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on right */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => clearItem(item.id, e)}
                      className="p-2 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from history"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 text-xs font-semibold text-slate-700 group-hover:text-indigo-700 transition-colors">
                      {item.type === "chat"
                        ? "Resume"
                        : item.type === "quiz"
                          ? "Review"
                          : item.type === "document"
                            ? "Open"
                            : "Practice"}
                      <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
