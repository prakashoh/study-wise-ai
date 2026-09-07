import { useState, useEffect, useRef } from "react";
import AppLayout from "../components/AppLayout";
import { api } from "../lib/api";
import { useLocation } from "react-router-dom";
import {
  Award,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Trophy,
  Upload,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export default function Quizzes() {
  const location = useLocation();
  const state = location.state as { documentId?: string } | null;

  const [documents, setDocuments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState("");
  
  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [quizLoading, setQuizLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
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

  const loadQuizzes = () => {
    setListLoading(true);
    api
      .getQuizzes()
      .then((res) => {
        setQuizzes(res);
      })
      .catch(() => {
        toast.error("Failed to load quizzes.");
      })
      .finally(() => {
        setListLoading(false);
      });
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

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
      toast.success(`"${file.name}" uploaded and selected for quiz!`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to upload file.");
      setUploadedFileName("");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateQuiz = async () => {
    if (!selectedDocId) {
      toast.error("Please select a document.");
      return;
    }

    setQuizLoading(true);
    try {
      const quiz = await api.generateQuiz(selectedDocId);
      toast.success("AI Quiz generated successfully!");
      setQuizzes((prev) => [quiz, ...prev]);
      startQuiz(quiz);
    } catch (err) {
      toast.error("Failed to generate quiz. Try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  const startQuiz = (quiz: any) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setAnswers({});
    setQuizFinished(false);
    setScore(0);
  };

  const handleSelectOption = (option: string) => {
    setAnswers({
      ...answers,
      [currentQuestionIdx]: option,
    });
  };

  const handleNext = () => {
    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Calculate Score
      let finalScore = 0;
      activeQuiz.questions.forEach((q: any, idx: number) => {
        if (answers[idx] === q.correctAnswer) {
          finalScore += 1;
        }
      });

      setScore(finalScore);
      setQuizFinished(true);

      // Submit attempt to backend to save statistics and award XP
      api
        .submitQuizAttempt(activeQuiz._id, finalScore, activeQuiz.questions.length, answers)
        .then(() => {
          toast.success(`Quiz completed! You earned ${finalScore * 15} XP!`);
          loadQuizzes(); // Refresh list to update history
        })
        .catch(() => {
          toast.error("Failed to save quiz attempt.");
        });
    }
  };

  const exitQuiz = () => {
    setActiveQuiz(null);
    setQuizFinished(false);
    setAnswers({});
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* --- ACTIVE QUIZ MODE --- */}
        {activeQuiz ? (
          <div className="bg-card border border-border/80 rounded-3xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto space-y-6">
            {!quizFinished ? (
              // Quiz Active In-Progress
              <>
                <div className="flex items-center justify-between border-b border-border pb-4 bg-secondary/10 -mx-6 -mt-6 p-6 rounded-t-3xl">
                  <div>
                    <h3 className="font-bold text-lg text-foreground truncate max-w-sm">
                      {activeQuiz.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Question {currentQuestionIdx + 1} of{" "}
                      {activeQuiz.questions.length}
                    </p>
                  </div>
                  <button
                    onClick={exitQuiz}
                    className="text-xs text-muted-foreground hover:text-foreground font-semibold hover:bg-secondary rounded-xl px-3 py-1.5 border border-border"
                  >
                    Quit Quiz
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentQuestionIdx + 1) /
                          activeQuiz.questions.length) *
                        100
                      }%`,
                    }}
                  />
                </div>

                {/* Question */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-foreground leading-snug">
                    {activeQuiz.questions[currentQuestionIdx].questionText}
                  </h4>

                  {/* Options */}
                  <div className="space-y-2 pt-2">
                    {activeQuiz.questions[currentQuestionIdx].options.map(
                      (option: string, idx: number) => {
                        const isSelected = answers[currentQuestionIdx] === option;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectOption(option)}
                            className={`w-full text-left p-4 rounded-2xl border text-sm font-semibold transition-all ${
                              isSelected
                                ? "bg-primary/5 border-primary text-primary"
                                : "bg-card border-border hover:bg-secondary/40"
                            }`}
                          >
                            <span className="inline-flex size-6 items-center justify-center rounded-full border border-border/80 mr-3 text-xs text-muted-foreground font-bold">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            {option}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleNext}
                    disabled={answers[currentQuestionIdx] === undefined}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50 disabled:pointer-events-none transition-transform hover:scale-[1.02]"
                  >
                    {currentQuestionIdx === activeQuiz.questions.length - 1
                      ? "Submit Quiz"
                      : "Next Question"}
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </>
            ) : (
              // Quiz Finished & Results Review
              <div className="space-y-6">
                {/* Result Hero */}
                <div className="text-center py-6 bg-gradient-brand/5 border border-primary/20 rounded-3xl p-6 relative overflow-hidden">
                  <Trophy className="size-16 text-amber-500 mx-auto fill-amber-500/10 animate-float" />
                  <h3 className="text-2xl font-bold mt-4 text-foreground">
                    Quiz Completed!
                  </h3>
                  <p className="text-4xl font-extrabold text-primary mt-2">
                    {score} / {activeQuiz.questions.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5 font-semibold">
                    Percentage: {Math.round((score / activeQuiz.questions.length) * 100)}%
                  </p>

                  <div className="flex justify-center gap-3 mt-6">
                    <button
                      onClick={() => startQuiz(activeQuiz)}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-glow"
                    >
                      <RefreshCw className="size-3.5" />
                      Try Again
                    </button>
                    <button
                      onClick={exitQuiz}
                      className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary"
                    >
                      Back to Quizzes
                    </button>
                  </div>
                </div>

                {/* Question Review Panel */}
                <div className="space-y-5 pt-4">
                  <h4 className="font-bold text-base border-b border-border pb-2">
                    Review Questions
                  </h4>

                  {activeQuiz.questions.map((q: any, idx: number) => {
                    const userAnswer = answers[idx];
                    const isCorrect = userAnswer === q.correctAnswer;

                    return (
                      <div
                        key={idx}
                        className={`border rounded-2xl p-5 space-y-3 bg-secondary/10 ${
                          isCorrect ? "border-emerald-500/20" : "border-rose-500/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="font-bold text-sm text-foreground">
                            {idx + 1}. {q.questionText}
                          </h5>
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5 shadow-sm">
                              <CheckCircle2 className="size-3.5 fill-emerald-500 text-white" />
                              Correct
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-rose-600 font-bold bg-rose-500/10 border border-rose-500/20 rounded-full px-2.5 py-0.5 shadow-sm">
                              <XCircle className="size-3.5 fill-rose-500 text-white" />
                              Incorrect
                            </span>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-1 text-xs">
                          <p className="text-muted-foreground font-medium">
                            Your answer:{" "}
                            <span
                              className={`font-semibold ${
                                isCorrect ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {userAnswer || "(skipped)"}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-muted-foreground font-medium">
                              Correct answer:{" "}
                              <span className="text-emerald-600 font-semibold">
                                {q.correctAnswer}
                              </span>
                            </p>
                          )}
                        </div>

                        {q.explanation && (
                          <div className="bg-secondary/40 border border-border/40 rounded-xl p-3 text-xs text-muted-foreground flex items-start gap-2.5">
                            <HelpCircle className="size-4.5 text-primary shrink-0 mt-0.5" />
                            <p>{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          // --- QUIZZES LIST & GENERATOR MODE ---
          <>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                AI Quiz Generator
              </h1>
              <p className="text-muted-foreground mt-1">
                Challenge yourself with multiple-choice questions created dynamically from your files.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Generator Panel */}
              <div className="lg:col-span-1 bg-card border border-border/80 rounded-3xl p-6 shadow-sm h-fit space-y-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Award className="size-4.5 text-primary" />
                  Generate New Quiz
                </h3>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="size-3.5" />
                        Target Notes
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

                    {documents.find((d) => d._id === selectedDocId) && (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/60 border border-border text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="size-3.5 text-primary shrink-0" />
                          <span className="font-semibold text-foreground truncate">
                            {documents.find((d) => d._id === selectedDocId)?.title}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                          <CheckCircle2 className="size-3" /> Ready
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCreateQuiz}
                    disabled={quizLoading || !selectedDocId}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {quizLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        Create AI Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* History & Directory List */}
              <div className="lg:col-span-2 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="font-bold text-lg">My Generated Quizzes</h3>

                {listLoading ? (
                  <div className="flex h-48 items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl bg-secondary/10 text-center">
                    <Award className="size-12 text-muted-foreground/60 mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      No quizzes found
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose a study document on the left to build your first test.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizzes.map((quiz) => {
                      const lastAttempt = quiz.attempts[quiz.attempts.length - 1];
                      return (
                        <div
                          key={quiz._id}
                          className="border border-border/70 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/20 hover:shadow-card transition-all bg-secondary/10"
                        >
                          <div className="space-y-1.5 max-w-md">
                            <h4 className="font-bold text-base text-foreground truncate">
                              {quiz.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="size-3.5" />
                              <span>
                                {new Date(quiz.createdAt).toLocaleDateString()}
                              </span>
                              <span>•</span>
                              <span>{quiz.questions.length} MCQs</span>
                            </div>
                            {lastAttempt && (
                              <div className="pt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-0.5">
                                  Last Score: {lastAttempt.score} /{" "}
                                  {lastAttempt.totalQuestions} (
                                  {Math.round(
                                    (lastAttempt.score /
                                      lastAttempt.totalQuestions) *
                                      100,
                                  )}
                                  %)
                                </span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => startQuiz(quiz)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-glow px-4 py-2 text-xs font-semibold hover:opacity-90 select-none cursor-pointer self-start md:self-auto"
                          >
                            Start Quiz
                            <ArrowRight className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
