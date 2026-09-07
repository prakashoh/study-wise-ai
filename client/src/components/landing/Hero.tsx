import heroApp from "@/assets/hero-app.jpg";
import { Play, Sparkles, Upload } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[620px]"
        style={{ background: "var(--gradient-soft)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-brand)" }}
      />

      <div className="relative mx-auto max-w-6xl px-5 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-card backdrop-blur">
          <Sparkles className="size-3.5 text-accent" />
          Powered by AI
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl leading-[1.08] font-bold md:text-6xl">
          Your Personal AI Tutor — <span className="text-gradient-brand">Study Smarter</span>, Not
          Harder
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Upload your notes and PDFs, ask questions, generate quizzes, and track your progress — all
          in one AI-powered workspace.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03]"
          >
            <Upload className="size-4" />
            Upload Your Notes
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold shadow-card transition-colors hover:bg-secondary"
          >
            <Play className="size-4 text-accent" />
            Watch Demo
          </a>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl animate-float">
          <img
            src={heroApp}
            alt="StudyMate AI workspace showing an AI chat answering a question from an uploaded PDF alongside a generated quiz"
            width={1408}
            height={1008}
            className="w-full rounded-3xl border border-border/70 shadow-glow"
          />
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Trusted for exam prep by students across{" "}
          <span className="font-semibold text-foreground">50+ colleges</span>
        </p>
      </div>
    </section>
  );
}
