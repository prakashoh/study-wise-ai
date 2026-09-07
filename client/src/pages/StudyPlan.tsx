import React, { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  ArrowRight,
  AlertCircle,
  Check,
  X,
  Target,
  Bell,
  Edit3,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import {
  ExamDetail,
  StudyTask,
  getSavedExams,
  saveExams,
  getClosestUpcomingExam,
  generateTasksForExam,
  generateAdaptiveWeeklySchedule,
  getSavedTasks,
  saveTasks,
} from "../lib/studyPlanUtils";

export default function StudyPlan() {
  // Exams state persisted in localStorage
  const [exams, setExams] = useState<ExamDetail[]>(() => getSavedExams());
  const [documents, setDocuments] = useState<any[]>([]);

  // Closest upcoming exam & today's assigned topic
  const upcomingInfo = getClosestUpcomingExam(exams);
  const activeExam = upcomingInfo.exam;
  const todaysTopic = upcomingInfo.todaysTopic;

  // Tasks state
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = getSavedTasks();
    if (saved && saved.length > 0) return saved;
    if (activeExam) {
      return generateTasksForExam(activeExam, todaysTopic);
    }
    return [];
  });

  // Pomodoro Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");

  // Modals state
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examName, setExamName] = useState("");
  const [examSubject, setExamSubject] = useState("Physics");
  const [examDate, setExamDate] = useState("2026-09-07");
  const [examPortion, setExamPortion] = useState("");

  // 1 or 2 Notes Slots
  const [examDoc1Id, setExamDoc1Id] = useState("");
  const [examDoc1Title, setExamDoc1Title] = useState("");
  const [examDoc2Id, setExamDoc2Id] = useState("");
  const [examDoc2Title, setExamDoc2Title] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState<1 | 2 | null>(null);
  const note1FileRef = useRef<HTMLInputElement>(null);
  const note2FileRef = useRef<HTMLInputElement>(null);

  const [examPriority, setExamPriority] = useState<"High" | "Medium" | "Low">("High");

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskSubject, setNewTaskSubject] = useState("Physics");
  const [newTaskDuration, setNewTaskDuration] = useState(20);
  const [newTaskPriority, setNewTaskPriority] = useState<"High" | "Medium" | "Low">("Medium");

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

    // Load uploaded documents from API
  useEffect(() => {
    api
      .getDocuments()
      .then((docs) => {
        setDocuments(docs || []);
        if (docs && docs.length > 0 && !examDoc1Title) {
          setExamDoc1Id(docs[0]._id);
          setExamDoc1Title(docs[0].title || docs[0].fileName);
        }
      })
      .catch(() => {});
  }, []);

  // Upload Note 1 or Note 2 directly from device
  const handleUploadNote = async (
    slot: 1 | 2,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSlot(slot);
    toast.loading(`Uploading ${file.name}...`);
    try {
      const res = await api.uploadDocument(file);
      toast.dismiss();
      toast.success(`Uploaded ${file.name} successfully!`);
      const newDoc = res.document;
      setDocuments((prev) => [newDoc, ...prev]);

      if (slot === 1) {
        setExamDoc1Id(newDoc._id);
        setExamDoc1Title(newDoc.title || newDoc.fileName);
      } else {
        setExamDoc2Id(newDoc._id);
        setExamDoc2Title(newDoc.title || newDoc.fileName);
      }
    } catch (err) {
      toast.dismiss();
      toast.error((err as Error).message || "Failed to upload note");
    } finally {
      setUploadingSlot(null);
      e.target.value = "";
    }
  };

  // Pomodoro countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      if (timerMode === "focus") {
        toast.success("Focus session completed! Great job, take a 5-minute break. 🎉");
        setTimerMode("break");
        setTimerSeconds(5 * 60);
      } else {
        toast.info("Break ended! Ready to focus again?");
        setTimerMode("focus");
        setTimerSeconds(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds, timerMode]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) {
          const next = !t.completed;
          if (next) toast.success("Task completed! +10 XP earned ✨");
          return { ...t, completed: next };
        }
        return t;
      });
      saveTasks(updated);
      return updated;
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: StudyTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      subject: newTaskSubject,
      durationMinutes: Number(newTaskDuration),
      completed: false,
      priority: newTaskPriority,
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setNewTaskTitle("");
    setShowAddModal(false);
    toast.success("New study task added!");
  };

  // Open Exam Configuration Modal
  const handleOpenExamModal = (examToEdit?: ExamDetail | null) => {
    if (examToEdit) {
      setEditingExamId(examToEdit.id);
      setExamName(examToEdit.title);
      setExamSubject(examToEdit.subject);
      setExamDate(examToEdit.date);
      setExamPortion(examToEdit.portion);
      setExamDoc1Id(examToEdit.documentId || "");
      setExamDoc1Title(examToEdit.documentTitle || "");
      setExamDoc2Id(examToEdit.document2Id || "");
      setExamDoc2Title(examToEdit.document2Title || "");
      setExamPriority(examToEdit.priority);
    } else {
      setEditingExamId(null);
      setExamName("");
      setExamSubject("Physics");
      setExamDate("2026-09-07");
      setExamPortion("");
      setExamDoc1Id(documents[0]?._id || "");
      setExamDoc1Title(documents[0]?.title || documents[0]?.fileName || "Newton's Laws of Motion.pdf");
      setExamDoc2Id("");
      setExamDoc2Title("");
      setExamPriority("High");
    }
    setShowExamModal(true);
  };

  // Save Exam and Generate Plan
  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examDate) {
      toast.error("Please enter exam name and exam date");
      return;
    }

    const doc1 = documents.find((d) => d._id === examDoc1Id);
    const resolvedDoc1Title = doc1 ? doc1.title || doc1.fileName : examDoc1Title || "Primary Study Notes.pdf";

    const doc2 = documents.find((d) => d._id === examDoc2Id);
    const resolvedDoc2Title = doc2 ? doc2.title || doc2.fileName : examDoc2Title || undefined;

    const newExam: ExamDetail = {
      id: editingExamId || Date.now().toString(),
      title: examName.trim(),
      subject: examSubject,
      date: examDate,
      portion:
        examPortion.trim() ||
        "Core Concepts, Formulas, Problem Solving & Diagnostic Recall",
      documentId: examDoc1Id || undefined,
      documentTitle: resolvedDoc1Title,
      document2Id: examDoc2Id || undefined,
      document2Title: resolvedDoc2Title,
      priority: examPriority,
    };

    let updatedExams: ExamDetail[];
    if (editingExamId) {
      updatedExams = exams.map((ex) => (ex.id === editingExamId ? newExam : ex));
    } else {
      updatedExams = [newExam, ...exams];
    }

    setExams(updatedExams);
    saveExams(updatedExams);

    // Compute new closest exam & auto-generate today's action plan
    const newUpcoming = getClosestUpcomingExam(updatedExams);
    const newTopic = newUpcoming.todaysTopic;
    const generatedTasks = generateTasksForExam(newExam, newTopic);
    setTasks(generatedTasks);
    saveTasks(generatedTasks);

    setShowExamModal(false);
    toast.success(
      `Study plan generated for "${newExam.title}"! Today's focus: ${newTopic}`,
    );
  };

  // Delete Exam
  const handleDeleteExam = (id: string) => {
    const updated = exams.filter((e) => e.id !== id);
    setExams(updated);
    saveExams(updated);
    toast.success("Exam removed from schedule");
  };

  // Refresh study plan for active exam
  const handleRefreshPlan = () => {
    if (!activeExam) return;
    setAiGenerating(true);
    setTimeout(() => {
      const freshTasks = generateTasksForExam(activeExam, todaysTopic);
      setTasks(freshTasks);
      saveTasks(freshTasks);
      setAiGenerating(false);
      setShowAiModal(false);
      toast.success(`Personalized study plan refreshed for ${activeExam.title}!`);
    }, 800);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = Math.round((completedCount / (totalCount || 1)) * 100);

  const weeklySchedule = activeExam
    ? generateAdaptiveWeeklySchedule(activeExam)
    : [];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
              <Calendar className="size-7 text-indigo-600" />
              Study Plan & Schedule
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-normal">
              Structured daily study sessions, exam countdowns, and AI-optimized milestones.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              onClick={() => handleOpenExamModal()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2.5 text-xs font-semibold hover:from-amber-700 hover:to-amber-800 transition-all shadow-xs cursor-pointer"
            >
              <Calendar className="size-4" />
              Set Exam & Portion
            </button>
            <button
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="size-4 fill-indigo-200 text-indigo-600" />
              Generate AI Plan
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white px-4 py-2.5 text-xs font-semibold hover:bg-indigo-700 transition-transform active:scale-95 shadow-xs cursor-pointer"
            >
              <Plus className="size-4" />
              Add Study Task
            </button>
          </div>
        </div>

        {/* --- DAILY EXAM COUNTDOWN & TOPIC REMINDER BANNER --- */}
        {activeExam && (
          <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-rose-500/10 border border-amber-300/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Bell className="size-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-md">
                    📅 Daily Exam Focus Alert
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {upcomingInfo.badgeText} • Exam Date: {activeExam.date}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                  Your exam <span className="text-indigo-600 font-extrabold">"{activeExam.title}"</span> is on <span className="text-rose-600 font-extrabold">{upcomingInfo.examDayName}</span>! Cover this topic today: <span className="text-amber-900 underline decoration-amber-400 font-semibold">"{todaysTopic}"</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-1">
                  {activeExam.documentTitle && (
                    <span>
                      Target Note 1: <strong className="text-slate-700">{activeExam.documentTitle}</strong>
                    </span>
                  )}
                  {activeExam.document2Title && (
                    <span>
                      • Note 2: <strong className="text-purple-700">{activeExam.document2Title}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenExamModal(activeExam)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
              >
                Edit Portion
              </button>
              <button
                onClick={handleRefreshPlan}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="size-3.5" />
                Refresh Plan
              </button>
            </div>
          </div>
        )}

        {/* --- TOP ROW: TODAY'S FOCUS & POMODORO TIMER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Today's Target Card (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Target className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      Today's Daily Target
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                      {activeExam ? `${activeExam.subject}: ${todaysTopic}` : "Physics & Mechanics Revision"}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">
                  <Flame className="size-3.5 fill-amber-500 text-amber-500" />
                  7 Day Streak
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Daily Milestone Progress</span>
                  <span className="text-indigo-600 font-bold">{progressPercent}% Completed</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {completedCount} of {totalCount} tasks completed
                  </span>
                  <span>+{completedCount * 10} XP gained today</span>
                </div>
              </div>
            </div>

            {/* Quick action shortcuts */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-500">
                Current Material: <strong>{activeExam?.documentTitle || "Newton's Laws of Motion.pdf"}</strong>
              </span>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
              >
                Open in AI Workspace
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Pomodoro Focus Timer Card (5 Cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white rounded-3xl p-6 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs">
                {timerMode === "focus" ? "🎯 Focus Session" : "☕ Short Break"}
              </span>
              <span className="text-xs text-indigo-100 flex items-center gap-1 font-medium">
                <Clock className="size-3.5" /> 25 / 5 Interval
              </span>
            </div>

            {/* Timer Display */}
            <div className="text-center my-4">
              <div className="font-mono text-5xl font-bold tracking-tight">
                {formatTimer(timerSeconds)}
              </div>
              <p className="text-xs text-indigo-100 mt-1.5 truncate max-w-[280px] mx-auto">
                {isTimerRunning
                  ? `Focus on: ${todaysTopic}...`
                  : "Ready to start your next study block?"}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="px-6 py-2.5 rounded-full bg-white text-indigo-700 font-bold text-xs flex items-center gap-2 hover:bg-indigo-50 transition-transform active:scale-95 shadow-md cursor-pointer"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="size-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-4 fill-indigo-700" /> Start Focus
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(timerMode === "focus" ? 25 * 60 : 5 * 60);
                }}
                className="size-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Reset timer"
              >
                <RotateCcw className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* --- MIDDLE ROW: TODAY'S TASKS & EXAM DEADLINES --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Today's Checklist (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="size-5 text-indigo-600" />
                Today's Action Items
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Click circle to mark completed
              </span>
            </div>

            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                    task.completed
                      ? "bg-slate-50/70 border-slate-200 opacity-60"
                      : "bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-indigo-600 hover:scale-110 transition-transform"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="size-5 fill-emerald-500 text-white" />
                      ) : (
                        <Circle className="size-5 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          task.completed ? "line-through text-slate-500" : "text-slate-800"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="font-medium text-indigo-600">{task.subject}</span>
                        <span>•</span>
                        <span>{task.durationMinutes} mins</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md shrink-0 ${
                      task.priority === "High"
                        ? "bg-rose-50 text-rose-600 border border-rose-100"
                        : task.priority === "Medium"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Deadlines & Milestones (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <AlertCircle className="size-5 text-amber-500" />
                  Upcoming Exams & Deadlines
                </h3>
                <button
                  onClick={() => handleOpenExamModal()}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="size-3.5" />
                  Add Exam
                </button>
              </div>

              <div className="space-y-3">
                {exams.map((item) => {
                  const countdown = getClosestUpcomingExam([item]);
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider">
                          {item.subject}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${
                              countdown.diffDays <= 5
                                ? "text-rose-600 bg-rose-50 border border-rose-100"
                                : "text-indigo-600 bg-indigo-50 border border-indigo-100"
                            }`}
                          >
                            {countdown.badgeText} ({countdown.examDayName})
                          </span>
                          <button
                            onClick={() => handleOpenExamModal(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Edit exam & portion"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExam(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete exam"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-xs text-slate-800 leading-snug">
                        {item.title}
                      </h4>

                      {/* Portion & Document tags */}
                      {item.portion && (
                        <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60 line-clamp-2">
                          <strong className="text-slate-700">Portion:</strong> {item.portion}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Date: {item.date}</span>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {item.documentTitle && (
                            <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md truncate max-w-[140px]">
                              📄 Note 1: {item.documentTitle}
                            </span>
                          )}
                          {item.document2Title && (
                            <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-md truncate max-w-[140px]">
                              📄 Note 2: {item.document2Title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Link
                to="/quizzes"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 font-semibold text-xs transition-colors"
              >
                Benchmark with AI Exam Quiz
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* --- 7-DAY ADAPTIVE STUDY ROADMAP --- */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-800">
                7-Day Adaptive Study Schedule
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-structured progression covering the exam portion before {activeExam?.date || "exam day"}.
              </p>
            </div>
            {activeExam && (
              <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1">
                Target: {activeExam.title}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {weeklySchedule.map((schedule, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border flex flex-col justify-between min-h-[110px] transition-all ${
                  schedule.status === "today"
                    ? "bg-indigo-50/80 border-indigo-500 shadow-2xs ring-1 ring-indigo-500"
                    : schedule.status === "done"
                      ? "bg-slate-50 border-slate-200 opacity-70"
                      : "bg-white border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase text-slate-500">
                      {schedule.day} <span className="text-[10px] text-slate-400 font-normal">({schedule.dateLabel})</span>
                    </span>
                    {schedule.status === "done" && (
                      <Check className="size-3.5 text-emerald-600 stroke-[3]" />
                    )}
                    {schedule.status === "today" && (
                      <span className="size-2 rounded-full bg-indigo-600 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-snug">
                    {schedule.topic}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-medium mt-2 ${
                    schedule.status === "today"
                      ? "text-indigo-600 font-bold"
                      : schedule.status === "done"
                        ? "text-emerald-600"
                        : "text-slate-400"
                  }`}
                >
                  {schedule.status === "today"
                    ? "In Progress (Today)"
                    : schedule.status === "done"
                      ? "Completed"
                      : "Scheduled"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- MODAL: SET EXAM DATE & PORTION --- */}
      {showExamModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Calendar className="size-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {editingExamId ? "Edit Exam & Portion" : "Set Exam Date & Portion"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI will adapt your daily study plan to cover this syllabus before the exam.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExamModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 pt-1">
              {/* Exam Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Exam Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Midterm: Classical Mechanics & Dynamics"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Subject & Exam Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physics, Math, CS"
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Exam Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Exam Portion / Topics */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5 flex items-center justify-between">
                  <span>Exam Portion / Topics to Cover *</span>
                  <span className="text-[11px] text-slate-400 font-normal lowercase">comma or newline separated</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Newton's 2nd Law (F = m × a), Momentum & Impulse, Work-Energy Theorem, Rotational Dynamics"
                  value={examPortion}
                  onChange={(e) => setExamPortion(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* ATTACH 1 OR 2 NOTES (UPLOAD OR SELECT) */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Study Notes / Syllabus Materials (Attach 1 or 2 Notes)
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    PDF, DOC, TXT supported
                  </span>
                </div>

                {/* Hidden file inputs for direct device upload */}
                <input
                  type="file"
                  ref={note1FileRef}
                  onChange={(e) => handleUploadNote(1, e)}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={note2FileRef}
                  onChange={(e) => handleUploadNote(2, e)}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                />

                {/* --- NOTE 1 (PRIMARY STUDY MATERIAL) --- */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                      Note 1 (Primary Study Notes / PDF) *
                    </span>
                    {examDoc1Title && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="size-3" /> Attached
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        value={examDoc1Id}
                        onChange={(e) => {
                          setExamDoc1Id(e.target.value);
                          const found = documents.find((d) => d._id === e.target.value);
                          if (found) setExamDoc1Title(found.title || found.fileName);
                        }}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 truncate"
                      >
                        <option value="">-- Choose from uploaded library --</option>
                        {documents.map((d) => (
                          <option key={d._id} value={d._id}>
                            📄 {d.title || d.fileName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => note1FileRef.current?.click()}
                      disabled={uploadingSlot === 1}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                    >
                      {uploadingSlot === 1 ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="size-3.5" />
                          <span>Upload PDF</span>
                        </>
                      )}
                    </button>
                  </div>

                  {examDoc1Title && (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                      <span className="truncate max-w-[320px] font-medium text-indigo-900">
                        📄 {examDoc1Title}
                      </span>
                    </div>
                  )}
                </div>

                {/* --- NOTE 2 (SECONDARY NOTE / SYLLABUS) --- */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="size-5 rounded-full bg-slate-400 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                      Note 2 (Secondary Notes / Syllabus PDF - Optional)
                    </span>
                    {examDoc2Title ? (
                      <button
                        type="button"
                        onClick={() => {
                          setExamDoc2Id("");
                          setExamDoc2Title("");
                        }}
                        className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                      >
                        Remove Note 2
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <select
                        value={examDoc2Id}
                        onChange={(e) => {
                          setExamDoc2Id(e.target.value);
                          const found = documents.find((d) => d._id === e.target.value);
                          if (found) {
                            setExamDoc2Title(found.title || found.fileName);
                          } else {
                            setExamDoc2Title("");
                          }
                        }}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium text-slate-700 truncate"
                      >
                        <option value="">-- Choose 2nd note (optional) --</option>
                        {documents.map((d) => (
                          <option key={d._id} value={d._id}>
                            📄 {d.title || d.fileName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => note2FileRef.current?.click()}
                      disabled={uploadingSlot === 2}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                    >
                      {uploadingSlot === 2 ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="size-3.5" />
                          <span>Upload 2nd PDF</span>
                        </>
                      )}
                    </button>
                  </div>

                  {examDoc2Title && (
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/70">
                      <span className="truncate max-w-[320px] font-medium text-purple-900">
                        📄 {examDoc2Title}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(["High", "Medium", "Low"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setExamPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        examPriority === p
                          ? "bg-amber-50 border-amber-500 text-amber-700"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs flex items-center gap-1.5"
                >
                  <Sparkles className="size-4" />
                  Save Exam & Generate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD STUDY TASK --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Add New Study Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read Physics Chapter 4..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(["High", "Medium", "Low"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        newTaskPriority === p
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: GENERATE AI PLAN --- */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Sparkles className="size-4.5 fill-indigo-200" />
                </span>
                <h3 className="font-bold text-base text-slate-900">AI Study Schedule Generator</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              StudyBuddy AI will analyze your exam date, portion, and uploaded PDF to generate a personalized study plan with daily action items.
            </p>

            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs space-y-1">
              <p className="font-bold text-indigo-900">
                Active Exam: {activeExam?.title || "Physics Midterm"}
              </p>
              <p className="text-indigo-700">
                Exam Date: <strong>{activeExam?.date} ({upcomingInfo.examDayName})</strong>
              </p>
              <p className="text-indigo-600">
                Today's Topic: <strong>{todaysTopic}</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefreshPlan}
                disabled={aiGenerating}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="size-3.5 fill-white/20" />
                {aiGenerating ? "Generating Plan..." : "Generate AI Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
