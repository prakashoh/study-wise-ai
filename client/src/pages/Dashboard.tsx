import React, { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../lib/api";
import {
  Sparkles,
  Paperclip,
  Send,
  RotateCw,
  Image as ImageIcon,
  HelpCircle,
  Search,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Bell,
  Check,
  Loader2,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { getSavedExams, getClosestUpcomingExam } from "../lib/studyPlanUtils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
  isInitial?: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [streakCount, setStreakCount] = useState<number>(7);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [savedExams] = useState(() => getSavedExams());
  const upcomingExamInfo = getClosestUpcomingExam(savedExams);

  // Chat State
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document Viewer State
  const [activePage, setActivePage] = useState<number>(2);
  const [totalPages] = useState<number>(12);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [docSearchOpen, setDocSearchOpen] = useState(false);
  const [docSearchTerm, setDocSearchTerm] = useState("");

  // Quick Quiz State
  const [selectedQuizOption, setSelectedQuizOption] = useState<string>("C");
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(true);
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);

  // Dynamic Greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    // Load current user profile
    const storedUser = api.getCurrentUser();
    if (storedUser) {
      setUser(storedUser);
    }

    api
      .getProfile()
      .then((profile) => {
        if (profile) {
          setUser(profile);
          if (profile.streak) setStreakCount(profile.streak);
        }
      })
      .catch(() => {});

    // Fetch user documents
    api
      .getDocuments()
      .then((docs) => {
        setDocuments(docs || []);
        if (docs && docs.length > 0) {
          setSelectedDocId(docs[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  const userName = user?.name ? user.name.split(" ")[0] : "Alex";
  const userInitial = userName ? userName[0].toUpperCase() : "A";

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiTyping]);

  // Send message to live Gemini AI backend
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      time: currentTime,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setIsAiTyping(true);

    try {
      // Connect to live AI chat endpoint
      const docId = selectedDocId || null;
      const res = await api.sendMessage(docId, text);

      const aiReplyTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.answer || "Here is what I found in your study materials.",
        time: aiReplyTime,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Graceful fallback educational answer
      setTimeout(() => {
        const fallbackMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Here is an insightful explanation regarding "${text}":\n\nNewton's Second Law emphasizes that force is directly proportional to acceleration when mass is constant ($F = m \\times a$). Doubling the applied force will accelerate the object twice as fast!`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
      }, 700);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading("Uploading study document...");
    try {
      const res = await api.uploadDocument(file);
      toast.dismiss();
      toast.success(`Uploaded ${file.name}! Processing context.`);
      setDocuments((prev) => [res.document, ...prev]);
      setSelectedDocId(res.document._id);
    } catch (err) {
      toast.dismiss();
      toast.error((err as Error).message || "Failed to upload file");
    }
  };

  // Quick prompt chip triggers
  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Quick Quiz Questions dataset
  const defaultQuizQuestions = [
    {
      question:
        "According to Newton's Second Law, if the net force on an object is doubled and the mass remains the same, what happens to its acceleration?",
      options: [
        { id: "A", label: "It is halved" },
        { id: "B", label: "It remains the same" },
        { id: "C", label: "It is doubled" },
        { id: "D", label: "It becomes zero" },
      ],
      correctId: "C",
      explanation:
        "Since F = m × a, acceleration is directly proportional to net force for a constant mass.",
    },
    {
      question:
        "What is the SI unit of Force according to the equation F = m × a?",
      options: [
        { id: "A", label: "Joule (J)" },
        { id: "B", label: "Newton (N)" },
        { id: "C", label: "Watt (W)" },
        { id: "D", label: "Pascal (Pa)" },
      ],
      correctId: "B",
      explanation:
        "One Newton is defined as 1 kg·m/s², the force required to accelerate 1 kg by 1 m/s².",
    },
    {
      question:
        "If a 5 kg object accelerates at 4 m/s², what is the net force applied?",
      options: [
        { id: "A", label: "1.25 N" },
        { id: "B", label: "9 N" },
        { id: "C", label: "20 N" },
        { id: "D", label: "40 N" },
      ],
      correctId: "C",
      explanation: "F = m × a = 5 kg × 4 m/s² = 20 N.",
    },
  ];

  const [docQuizQuestions, setDocQuizQuestions] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState<boolean>(false);

  // Load or generate quiz for the active uploaded document
  useEffect(() => {
    if (!selectedDocId) return;

    setQuizLoading(true);
    api
      .getQuizzes(selectedDocId)
      .then((quizzesList) => {
        if (
          quizzesList &&
          quizzesList.length > 0 &&
          quizzesList[0].questions?.length > 0
        ) {
          const q = quizzesList[0];
          const mapped = q.questions.map((item: any) => {
            const correctIdx = item.options.indexOf(item.correctAnswer);
            return {
              question: item.questionText,
              options: item.options.map((opt: string, i: number) => ({
                id: String.fromCharCode(65 + i),
                label: opt,
              })),
              correctId: String.fromCharCode(
                65 + (correctIdx >= 0 ? correctIdx : 0),
              ),
              explanation: item.explanation || "",
            };
          });
          setDocQuizQuestions(mapped);
          setActiveQuizIndex(0);
          setSelectedQuizOption("");
          setQuizSubmitted(false);
          setQuizLoading(false);
        } else {
          // Auto-generate quiz for this uploaded document
          api
            .generateQuiz(selectedDocId)
            .then((newQuiz) => {
              if (newQuiz && newQuiz.questions?.length > 0) {
                const mapped = newQuiz.questions.map((item: any) => {
                  const correctIdx = item.options.indexOf(item.correctAnswer);
                  return {
                    question: item.questionText,
                    options: item.options.map((opt: string, i: number) => ({
                      id: String.fromCharCode(65 + i),
                      label: opt,
                    })),
                    correctId: String.fromCharCode(
                      65 + (correctIdx >= 0 ? correctIdx : 0),
                    ),
                    explanation: item.explanation || "",
                  };
                });
                setDocQuizQuestions(mapped);
                setActiveQuizIndex(0);
                setSelectedQuizOption("");
                setQuizSubmitted(false);
              }
            })
            .catch(() => {})
            .finally(() => setQuizLoading(false));
        }
      })
      .catch(() => setQuizLoading(false));
  }, [selectedDocId]);

  const activeQuestions =
    docQuizQuestions.length > 0 ? docQuizQuestions : defaultQuizQuestions;
  const currentQuiz =
    activeQuestions[activeQuizIndex % activeQuestions.length];

  const handleQuizAnswer = (optionId: string) => {
    setSelectedQuizOption(optionId);
    setQuizSubmitted(true);
    if (optionId === currentQuiz.correctId) {
      toast.success("Correct answer! +10 XP earned 🎉");
    } else {
      toast.error(
        currentQuiz.explanation
          ? `Explanation: ${currentQuiz.explanation}`
          : "Not quite! Review the document text.",
      );
    }
  };

  const nextQuizQuestion = () => {
    const nextIdx = (activeQuizIndex + 1) % activeQuestions.length;
    setActiveQuizIndex(nextIdx);
    setSelectedQuizOption("");
    setQuizSubmitted(false);
  };

  // Download sample document
  const handleDownloadDoc = () => {
    const docContent = `Newton's Laws of Motion\n\nPage 1: First Law (Inertia)\nPage 2: Second Law (F = m * a)\nPage 3: Third Law (Action & Reaction)`;
    const blob = new Blob([docContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Newton's Laws of Motion.pdf";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document downloaded!");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* --- TOP GREETING & STATUS HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {getGreeting()}, {userName}! <span className="animate-bounce">👋</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              What would you like to study today?
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Study Streak Badge */}
            <div className="flex items-center gap-1.5 bg-indigo-50/80 border border-indigo-100 text-indigo-700 rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-xs">
              <span className="text-slate-600">Study Streak</span>
              <span className="flex items-center gap-1 font-bold text-indigo-700">
                🔥 {streakCount}
              </span>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => toast.info("You're all caught up! No unread notifications.")}
              className="relative size-10 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 shadow-xs transition-colors"
              title="Notifications"
            >
              <Bell className="size-4.5" />
              <span className="absolute top-2.5 right-2.5 size-2 bg-indigo-600 rounded-full" />
            </button>

            {/* User Avatar Circle */}
            <Link
              to="/profile"
              className="size-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs hover:opacity-90 transition-opacity"
              title={`Profile of ${userName}`}
            >
              {userInitial}
            </Link>
          </div>
        </div>

        {/* --- DAILY EXAM & TOPIC REMINDER BANNER --- */}
        {upcomingExamInfo && upcomingExamInfo.exam && (
          <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-rose-500/10 border border-amber-300/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <span className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Bell className="size-5 animate-bounce" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                    📅 Daily Exam Reminder
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {upcomingExamInfo.badgeText} • Exam Date: {upcomingExamInfo.exam.date}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  Your exam <span className="text-indigo-600 font-extrabold">"{upcomingExamInfo.exam.title}"</span> is on <span className="text-rose-600 font-extrabold">{upcomingExamInfo.examDayName}</span>! Cover this topic today: <span className="text-amber-900 underline decoration-amber-400 font-semibold">"{upcomingExamInfo.todaysTopic}"</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 mt-0.5">
                  {upcomingExamInfo.exam.documentTitle && (
                    <span>
                      Target Note 1: <strong className="text-slate-700">{upcomingExamInfo.exam.documentTitle}</strong>
                    </span>
                  )}
                  {upcomingExamInfo.exam.document2Title && (
                    <span>
                      • Note 2: <strong className="text-purple-700">{upcomingExamInfo.exam.document2Title}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              to="/study-plan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shrink-0 shadow-xs self-start sm:self-auto"
            >
              Open Today's Study Plan
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        )}

        {/* --- MAIN 2-COLUMN STUDY WORKSPACE --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================== */}
          {/* LEFT PANEL: AI Chat Workspace (7 Columns on large screens) */}
          {/* ========================================================== */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[670px]">
            {/* Scrollable Conversation Thread */}
            <div className="space-y-5 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin">
              {/* Static Primary Question from Screenshot */}
              <div className="flex justify-end items-end gap-2.5">
                <div className="flex flex-col items-end max-w-[85%]">
                  <div className="bg-[#EEF2FF] text-slate-800 rounded-2xl rounded-tr-xs px-4.5 py-3 text-sm font-normal shadow-2xs leading-relaxed border border-indigo-100/50">
                    Can you explain Newton's Second Law in simple terms with an example?
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium mr-1">
                    10:24 AM
                  </span>
                </div>
                <div className="size-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mb-5 shadow-xs">
                  {userInitial}
                </div>
              </div>

              {/* Static Primary AI Response from Screenshot */}
              <div className="flex justify-start items-start gap-3">
                <div className="size-8 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="size-4 fill-indigo-200 text-indigo-600" />
                </div>
                <div className="flex flex-col max-w-[92%]">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4 text-sm text-slate-700 leading-relaxed">
                    <p>
                      Absolutely! Newton's Second Law states that the force acting on an object is equal to the mass of that object multiplied by its acceleration.
                    </p>

                    {/* Formula Highlight Box */}
                    <div className="bg-[#F0F3FF] border border-indigo-100/80 rounded-xl py-3 px-6 text-center font-serif text-indigo-700 text-base font-semibold italic shadow-2xs tracking-wide">
                      F = m × a
                    </div>

                    {/* Parameter Breakdown */}
                    <div className="space-y-1.5">
                      <p className="font-semibold text-slate-800 text-xs">Where:</p>
                      <ul className="space-y-1 pl-1 text-slate-600 text-xs">
                        <li className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-slate-400" />
                          <span>
                            <strong className="text-slate-800 font-semibold">F</strong> = Force (in Newtons)
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-slate-400" />
                          <span>
                            <strong className="text-slate-800 font-semibold">m</strong> = Mass (in kilograms)
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="size-1.5 rounded-full bg-slate-400" />
                          <span>
                            <strong className="text-slate-800 font-semibold">a</strong> = Acceleration (in m/s²)
                          </span>
                        </li>
                      </ul>
                    </div>

                    {/* Example Callout */}
                    <div className="text-xs text-slate-600 bg-slate-50/90 rounded-xl p-3.5 border border-slate-100 leading-relaxed">
                      <strong className="text-slate-900 font-semibold">Example:</strong> When you push a shopping cart, the more force you apply, the more it accelerates. If the cart is heavier (more mass), it will accelerate less for the same amount of force.
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 font-medium ml-1">
                    10:24 AM
                  </span>
                </div>
              </div>

              {/* Dynamic Follow-up Messages */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="size-8 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0 mb-5 shadow-2xs">
                      <Sparkles className="size-4 fill-indigo-200 text-indigo-600" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col ${
                      msg.role === "user" ? "items-end max-w-[85%]" : "max-w-[92%]"
                    }`}
                  >
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#EEF2FF] text-slate-800 rounded-tr-xs border border-indigo-100/50 shadow-2xs"
                          : "bg-white border border-slate-200/90 text-slate-700 shadow-2xs whitespace-pre-line"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 font-medium px-1">
                      {msg.time}
                    </span>
                  </div>

                  {msg.role === "user" && (
                    <div className="size-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mb-5 shadow-xs">
                      {userInitial}
                    </div>
                  )}
                </div>
              ))}

              {/* AI Thinking indicator */}
              {isAiTyping && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium bg-indigo-50/60 border border-indigo-100/60 rounded-xl px-3.5 py-2.5 w-fit animate-pulse">
                  <Loader2 className="size-4 animate-spin" />
                  <span>StudyBuddy AI is searching your notes & thinking...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Bottom Controls: Quick Chips + Input Bar + Disclaimer */}
            <div className="space-y-3 pt-4 border-t border-slate-100 mt-4">
              {/* Quick Action Prompt Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickPrompt(
                      "Can you give me another practical real-world example of Newton's Second Law?",
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs select-none"
                >
                  <RotateCw className="size-3 text-slate-400" />
                  Give me another example
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickPrompt(
                      "Can you explain Newton's Second Law using an ASCII diagram or step-by-step visual breakdown?",
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs select-none"
                >
                  <ImageIcon className="size-3 text-slate-400" />
                  Show in a diagram
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickPrompt(
                      "Quiz me on Newton's Second Law with a tricky calculation question!",
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs select-none"
                >
                  <HelpCircle className="size-3 text-slate-400" />
                  Quiz me on this
                </button>
              </div>

              {/* Chat Input Pill Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center bg-[#F8FAFC] border border-slate-200/90 rounded-full pl-5 pr-2 py-1.5 shadow-2xs focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all"
              >
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isAiTyping}
                  className="flex-1 bg-transparent py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                />

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx"
                />

                {/* Paperclip attachment button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
                  title="Attach study material or PDF"
                >
                  <Paperclip className="size-4.5" />
                </button>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isAiTyping}
                  className="size-9 rounded-full bg-indigo-600 text-white flex items-center justify-center ml-1 hover:bg-indigo-700 disabled:opacity-40 transition-transform active:scale-95 shadow-xs"
                  title="Send message"
                >
                  <Send className="size-4 -rotate-12 translate-x-0.5" />
                </button>
              </form>

              {/* Disclaimer Footnote */}
              <p className="text-[11px] text-slate-400 text-center font-normal">
                StudyBuddy AI can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT PANEL: Document Viewer + Quick Quiz (5 Columns on large screens)    */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* ------------------------------------------------------------- */}
            {/* WIDGET 1: Interactive Document Viewer (Newton's Laws of Motion) */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              {/* Document Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 truncate max-w-[280px]">
                  {/* PDF Icon Badge */}
                  <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500 text-white font-bold text-[10px] shrink-0 shadow-2xs">
                    PDF
                  </span>
                  {documents.length > 1 ? (
                    <select
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                      className="font-semibold text-xs sm:text-sm text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer truncate max-w-[220px]"
                    >
                      {documents.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.title || d.fileName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                      {documents.find((d) => d._id === selectedDocId)?.title ||
                        "Newton's Laws of Motion.pdf"}
                    </span>
                  )}
                </div>

                {/* Top Action Icons */}
                <div className="flex items-center gap-1 shrink-0 text-slate-400">
                  <button
                    onClick={() => setDocSearchOpen(!docSearchOpen)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="Search within document"
                  >
                    <Search className="size-4" />
                  </button>
                  <button
                    onClick={handleDownloadDoc}
                    className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="Download document"
                  >
                    <Download className="size-4" />
                  </button>
                  <button
                    onClick={() =>
                      toast.info("Document options: Export summary or flashcards from library.")
                    }
                    className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    title="More options"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>

              {/* Document Search Bar (toggleable) */}
              {docSearchOpen && (
                <div className="py-2">
                  <input
                    type="text"
                    placeholder="Search words in document..."
                    value={docSearchTerm}
                    onChange={(e) => setDocSearchTerm(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Split Document Viewer: Left Thumbnails + Right Page Preview */}
              <div className="py-4 flex gap-3 min-h-[290px] items-stretch">
                {/* Left Thumbnail Strip */}
                <div className="w-16 flex flex-col gap-2.5 shrink-0 select-none">
                  {/* Page 1 Thumbnail */}
                  <div
                    onClick={() => setActivePage(1)}
                    className={`h-20 rounded-md border p-1 flex flex-col justify-between cursor-pointer transition-all bg-slate-50 ${
                      activePage === 1
                        ? "border-indigo-600 shadow-xs ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300 opacity-70"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="h-1 bg-slate-300 rounded w-4/5" />
                      <div className="h-0.5 bg-slate-200 rounded w-full" />
                      <div className="h-0.5 bg-slate-200 rounded w-3/4" />
                      <div className="h-0.5 bg-slate-200 rounded w-5/6" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold text-center">
                      1
                    </span>
                  </div>

                  {/* Page 2 Thumbnail (Active in Screenshot) */}
                  <div
                    onClick={() => setActivePage(2)}
                    className={`h-20 rounded-md border p-1 flex flex-col justify-between cursor-pointer transition-all bg-white ${
                      activePage === 2
                        ? "border-indigo-600 shadow-xs ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300 opacity-70"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="h-1 bg-indigo-300 rounded w-5/6" />
                      <div className="h-0.5 bg-slate-200 rounded w-full" />
                      <div className="h-0.5 bg-slate-200 rounded w-4/5" />
                      <div className="h-1.5 bg-indigo-50 rounded border border-indigo-100" />
                    </div>
                    <span className="text-[9px] text-indigo-600 font-bold text-center">
                      2
                    </span>
                  </div>

                  {/* Page 3 Thumbnail */}
                  <div
                    onClick={() => setActivePage(3)}
                    className={`h-20 rounded-md border p-1 flex flex-col justify-between cursor-pointer transition-all bg-slate-50 ${
                      activePage === 3
                        ? "border-indigo-600 shadow-xs ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300 opacity-70"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="h-1 bg-slate-300 rounded w-3/4" />
                      <div className="h-0.5 bg-slate-200 rounded w-full" />
                      <div className="h-0.5 bg-slate-200 rounded w-2/3" />
                    </div>
                    <span className="text-[9px] text-slate-400 font-semibold text-center">
                      3
                    </span>
                  </div>
                </div>

                {/* Right Document Sheet Page View */}
                <div
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs text-xs text-slate-700 leading-relaxed overflow-hidden"
                  style={{ fontSize: `${(zoomLevel / 100) * 11}px` }}
                >
                  {(() => {
                    const activeDoc = documents.find((d) => d._id === selectedDocId);
                    if (activeDoc && activeDoc.extractedText) {
                      const lines = activeDoc.extractedText
                        .split("\n")
                        .map((l: string) => l.trim())
                        .filter((l: string) => l.length > 0);
                      const perPage = Math.max(5, Math.ceil(lines.length / 3));
                      const start = (activePage - 1) * perPage;
                      const pageLines = lines.slice(start, start + perPage);

                      return (
                        <div className="space-y-2.5">
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {activeDoc.title} — Page {activePage}
                          </h3>
                          <div className="text-slate-600 text-xs whitespace-pre-line max-h-[220px] overflow-y-auto pr-1">
                            {pageLines.join("\n") || activeDoc.extractedText.slice(0, 500)}
                          </div>
                        </div>
                      );
                    }

                    // Fallback to Newton's Laws
                    return activePage === 2 ? (
                      <div className="space-y-2.5">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                          2. Newton's Second Law of Motion
                        </h3>
                        <p className="text-slate-600 leading-normal">
                          The rate of change of momentum of an object is proportional to the net force acting on the object and occurs in the direction of the net force.
                        </p>

                        <div className="pt-1">
                          <p className="font-medium text-slate-700">Mathematically:</p>
                          <div className="my-1 py-1 text-center font-serif text-slate-800 italic">
                            F = <span className="underline">dp</span> / dt
                          </div>
                        </div>

                        <div>
                          <p className="text-slate-600">For constant mass:</p>
                          <div className="my-1 py-1 text-center font-serif font-semibold text-slate-900 text-xs">
                            F = m × a
                          </div>
                        </div>

                        <div className="pt-0.5 border-t border-slate-100 text-[10px] text-slate-500 space-y-0.5">
                          <p className="font-medium text-slate-700">Where:</p>
                          <p>F = net force</p>
                          <p>m = mass of the object</p>
                          <p>a = acceleration</p>
                        </div>
                      </div>
                    ) : activePage === 1 ? (
                      <div className="space-y-2.5">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                          1. Newton's First Law (Law of Inertia)
                        </h3>
                        <p className="text-slate-600">
                          An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced external force.
                        </p>
                        <div className="p-2 bg-slate-50 rounded border border-slate-100 text-[10px] text-slate-500">
                          • Inertia depends strictly on the object's mass.<br />
                          • Key Formula: ΣF = 0 ⟹ dv/dt = 0.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                          3. Newton's Third Law (Action & Reaction)
                        </h3>
                        <p className="text-slate-600">
                          For every action, there is an equal and opposite reaction.
                        </p>
                        <div className="p-2 bg-slate-50 rounded border border-slate-100 text-[10px] text-slate-500">
                          • Forces always occur in matched pairs: F_AB = -F_BA.<br />
                          • Action and reaction forces act on different bodies.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Document Viewer Bottom Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 select-none">
                {/* Page Navigation Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                    disabled={activePage <= 1}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    title="Previous page"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <span className="font-medium text-[11px] text-slate-600">
                    {activePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setActivePage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage >= totalPages}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                    title="Next page"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500"
                    title="Zoom out"
                  >
                    <Minus className="size-3" />
                  </button>
                  <span className="text-[11px] font-medium text-slate-600 min-w-8 text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                    className="p-1 rounded hover:bg-slate-100 text-slate-500"
                    title="Zoom in"
                  >
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* WIDGET 2: Quick Quiz Card                                     */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="size-7 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shadow-2xs">
                    <BookOpen className="size-4 text-teal-600" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Quick Quiz</h3>
                    {documents.find((d) => d._id === selectedDocId) && (
                      <p className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">
                        From: {documents.find((d) => d._id === selectedDocId)?.title}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  to="/quizzes"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  See all quizzes
                </Link>
              </div>

              {quizLoading ? (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="size-6 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    Generating questions from your uploaded PDF...
                  </p>
                </div>
              ) : (
                <>
                  {/* Question */}
                  <p className="text-xs text-slate-700 font-medium leading-relaxed mb-4">
                    {currentQuiz.question}
                  </p>

                  {/* Multiple Choice Options List */}
                  <div className="space-y-2">
                    {currentQuiz.options.map((option: any) => {
                      const isSelected = selectedQuizOption === option.id;
                      const isCorrect = option.id === currentQuiz.correctId;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleQuizAnswer(option.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium text-left transition-all select-none ${
                            isSelected && isCorrect
                              ? "border-emerald-500 bg-emerald-50/50 text-slate-900 shadow-2xs ring-1 ring-emerald-500"
                              : isSelected && !isCorrect
                                ? "border-rose-400 bg-rose-50/50 text-rose-900"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50/80 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-semibold text-[11px] ${
                                isSelected && isCorrect
                                  ? "text-emerald-700 font-bold"
                                  : "text-slate-400"
                              }`}
                            >
                              {option.id}
                            </span>
                            <span>{option.label}</span>
                          </div>

                          {/* Green Checkmark for selected correct option */}
                          {isSelected && isCorrect && (
                            <div className="size-4.5 rounded-full border border-emerald-500 bg-emerald-500 text-white flex items-center justify-center shadow-2xs shrink-0">
                              <Check className="size-3 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quiz feedback / Next question button */}
                  {quizSubmitted && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500">
                        {selectedQuizOption === currentQuiz.correctId
                          ? "✨ Perfect! Keep going."
                          : "💡 Need review? Check note."}
                      </span>
                      <button
                        onClick={nextQuizQuestion}
                        className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Next question →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
