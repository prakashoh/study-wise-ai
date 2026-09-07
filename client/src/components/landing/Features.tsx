import {
  BarChart3,
  Bot,
  FileText,
  Layers,
  NotebookPen,
  Target,
  type LucideIcon,
} from "lucide-react";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: FileText,
    title: "Smart Upload",
    text: "Upload PDFs, notes, and DOCX files instantly.",
  },
  {
    icon: Bot,
    title: "AI Q&A Chat",
    text: "Ask anything, get answers from your own notes.",
  },
  {
    icon: NotebookPen,
    title: "Auto Summaries",
    text: "Long chapters condensed into key points.",
  },
  {
    icon: Target,
    title: "AI-Generated Quizzes",
    text: "Test yourself with auto-created MCQs.",
  },
  {
    icon: Layers,
    title: "Smart Flashcards",
    text: "Auto-built flashcards for quick revision.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    text: "Visual insights into your study habits.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold md:text-4xl">Everything you need to ace the exam</h2>
        <p className="mt-3 text-muted-foreground">
          One workspace that reads your material, answers your questions, and keeps you accountable.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-gradient-brand group-hover:text-primary-foreground">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
