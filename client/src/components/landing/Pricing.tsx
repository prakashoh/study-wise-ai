import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "forever",
    perks: ["3 documents", "50 AI questions / month", "Quizzes & flashcards", "Basic analytics"],
    highlighted: false,
  },
  {
    name: "Student Pro",
    price: "$6",
    note: "per month",
    perks: [
      "Unlimited documents",
      "Unlimited AI questions",
      "Cross-document answers",
      "Full analytics & streaks",
      "PDF export & sharing",
    ],
    highlighted: true,
  },
  {
    name: "Campus",
    price: "$29",
    note: "per month",
    perks: ["Everything in Pro", "Up to 10 seats", "Shared study library", "Class leaderboard"],
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-5 py-20 md:py-28">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold md:text-4xl">Simple pricing for students</h2>
        <p className="mt-3 text-muted-foreground">Start free. Upgrade when exam season hits.</p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-6 transition-transform duration-300 hover:-translate-y-1 ${
              plan.highlighted
                ? "border-primary/40 bg-card shadow-glow"
                : "border-border bg-card shadow-card"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-6 rounded-full bg-gradient-brand px-3 py-1 text-xs font-semibold text-primary-foreground">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.note}</span>
            </p>
            <ul className="mt-6 space-y-2.5">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                  {perk}
                </li>
              ))}
            </ul>
            <a
              href="#get-started"
              className={`mt-7 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-transform hover:scale-[1.02] ${
                plan.highlighted
                  ? "bg-gradient-brand text-primary-foreground"
                  : "border border-border bg-secondary text-foreground"
              }`}
            >
              Get started
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
