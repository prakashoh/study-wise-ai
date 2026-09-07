import { CloudUpload, MessagesSquare, Trophy } from "lucide-react";

const steps = [
  {
    icon: CloudUpload,
    step: "01",
    title: "Upload your material",
    text: "Drag in lecture PDFs, class notes, or DOCX files. We extract and index the text automatically.",
  },
  {
    icon: MessagesSquare,
    step: "02",
    title: "Ask your AI tutor",
    text: "Chat with answers grounded in your own notes — across one document or your whole library.",
  },
  {
    icon: Trophy,
    step: "03",
    title: "Practice and track",
    text: "Generate quizzes and flashcards, then watch streaks, scores, and mastery build up over time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border bg-secondary/40 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold md:text-4xl">From PDF to prepared in three steps</h2>
          <p className="mt-3 text-muted-foreground">
            No setup, no prompt engineering. Just your material and better answers.
          </p>
        </div>

        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, text }) => (
            <li
              key={step}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-card transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="font-display text-4xl font-bold text-gradient-brand">{step}</span>
              <Icon className="absolute top-6 right-6 size-5 text-accent" />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
