import { Placeholder } from "./Placeholder";

const TESTIMONIALS = [
  {
    quote: "Sessions are tight, structured and I actually see progress. No wasted time.",
    name: "Marta",
    age: 34,
    role: "Product Manager",
  },
  {
    quote: "Training outdoors three mornings a week changed how I start my day.",
    name: "Daniel",
    age: 38,
    role: "Architect",
  },
  {
    quote: "Calm, clear and demanding when it counts. Best coach I've worked with.",
    name: "Sofía",
    age: 31,
    role: "Lawyer",
  },
];

export function SocialProof() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Clients
        </p>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          Trained consistently. For years.
        </h2>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col justify-between gap-6 rounded-md border border-border bg-surface p-6"
            >
              <blockquote className="text-[15px] leading-relaxed">
                "{t.quote}"
              </blockquote>
              <figcaption className="text-xs uppercase tracking-wider text-muted-foreground">
                {t.name}, {t.age} · {t.role}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Placeholder label="Studio · 1:1" ratio="1/1" />
          <Placeholder label="Park · 1:1" ratio="1/1" />
          <Placeholder label="Beach · 1:1" ratio="1/1" />
          <Placeholder label="Studio · 1:1" ratio="1/1" />
        </div>
      </div>
    </section>
  );
}
