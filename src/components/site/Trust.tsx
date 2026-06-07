import { Placeholder } from "./Placeholder";

const BULLETS = [
  {
    k: "10+ years",
    v: "Coaching strength & conditioning across studio and outdoor settings.",
  },
  {
    k: "Programming first",
    v: "Every session fits a plan — progression is tracked, not improvised.",
  },
  {
    k: "Built for consistency",
    v: "Sessions sized for real schedules. Clients train year after year.",
  },
];

export function Trust() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:gap-14">
          <div>
            <Placeholder label="Coach Portrait · 4:5" ratio="4/5" />
            <div className="mt-4">
              <p className="font-display text-lg font-semibold">Alex Moreno</p>
              <p className="text-sm text-muted-foreground">
                Strength &amp; Conditioning Coach · Barcelona
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              About the coach
            </p>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Direct coaching. Measured progress.
            </h2>
            <ul className="mt-8 space-y-6">
              {BULLETS.map((b) => (
                <li key={b.k} className="grid grid-cols-[140px_1fr] gap-4 border-t border-border pt-6">
                  <span className="font-display text-sm font-semibold text-accent">
                    {b.k}
                  </span>
                  <span className="text-sm text-muted-foreground">{b.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Placeholder label="Studio · 16:10" ratio="16/10" />
          <Placeholder label="Outdoor · Barcelona · 16:10" ratio="16/10" />
        </div>
      </div>
    </section>
  );
}
