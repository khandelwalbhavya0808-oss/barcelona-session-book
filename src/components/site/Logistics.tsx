const ITEMS: Array<{ k: string; v: string }> = [
  { k: "Base location", v: "Private studio · Eixample, Barcelona" },
  { k: "Outdoor sessions", v: "Parc de la Ciutadella · Barceloneta beach · Montjuïc" },
  { k: "Session length", v: "30, 45 or 60 minutes" },
  { k: "What to bring", v: "Training clothes, water, a small towel. Equipment provided." },
  { k: "Who it's for", v: "Busy professionals and expats wanting a structured weekly habit." },
  { k: "Not for", v: "Drop-in workouts without a plan or pure cardio classes." },
];

export function Logistics() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Practical
        </p>
        <h2 className="font-display text-3xl font-semibold sm:text-4xl">
          Logistics
        </h2>

        <dl className="mt-10 grid gap-x-12 gap-y-0 md:grid-cols-2">
          {ITEMS.map((item) => (
            <div
              key={item.k}
              className="grid grid-cols-[140px_1fr] items-baseline gap-4 border-t border-border py-5 sm:grid-cols-[180px_1fr]"
            >
              <dt className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {item.k}
              </dt>
              <dd className="text-sm sm:text-[15px]">{item.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
