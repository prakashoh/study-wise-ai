import { ArrowRight, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function CtaFooter() {
  return (
    <footer id="get-started" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand px-6 py-14 text-center shadow-glow md:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold text-primary-foreground md:text-4xl">
            Turn hours of textbook searching into seconds
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-primary-foreground/80 md:text-base">
            Join students prepping smarter with an AI tutor that actually knows their notes.
          </p>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-card transition-transform hover:scale-[1.03]"
          >
            Get Started Free
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-brand">
              <GraduationCap className="size-4 text-primary-foreground" />
            </span>
            <span className="font-display font-semibold text-foreground">StudyMate AI</span>
          </div>
          <p>© {new Date().getFullYear()} StudyMate AI. Built for students.</p>
        </div>
      </div>
    </footer>
  );
}
