const ITEMS: Array<{ k: string; v: string }> = [
  { k: "Base location", v: "Private studio · Eixample, Barcelona" },
  { k: "Session length", v: "30, 45 or 60 minutes" },
  { k: "Format", v: "1:1 only. Optional partner sessions on request." },
  { k: "What to bring", v: "Training clothes, water, a small towel. Equipment provided." },
  { k: "Who it's for", v: "Busy professionals and expats wanting a structured weekly habit." },
  { k: "Not for", v: "Drop-in workouts without a plan or pure cardio classes." },
];

const AREAS = ["Ciutadella", "Barceloneta", "Montjuïc", "Poblenou"];

export function Logistics() {
  return (
    <section id="details" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-4 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              <span className="h-px w-10 bg-accent" />
              Details
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              The practical stuff.
            </h2>
          </div>
        </div>

        <dl className="grid gap-x-16 md:grid-cols-2">
          {ITEMS.map((item) => (
            <div
              key={item.k}
              className="grid grid-cols-[160px_1fr] items-baseline gap-6 border-t border-border py-6 last:border-b sm:grid-cols-[200px_1fr]"
            >
              <dt className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {item.k}
              </dt>
              <dd className="text-[15px] leading-relaxed">{item.v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 border-t border-border pt-8">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Outdoor areas
          </p>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <span
                key={a}
                className="inline-flex items-center rounded-sm border border-border px-3 py-1.5 text-xs uppercase tracking-wider"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
