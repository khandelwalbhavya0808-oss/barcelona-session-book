import coachPortrait from "@/assets/coach-portrait.jpg";
import studioWide from "@/assets/studio-wide.jpg";
import outdoorBarcelona from "@/assets/outdoor-barcelona.jpg";

const BULLETS = [
  {
    n: "01",
    k: "Ten years coaching",
    v: "Strength & conditioning across private studio and outdoor settings in Barcelona.",
  },
  {
    n: "02",
    k: "Programming first",
    v: "Every session fits a plan. Progression is tracked, not improvised.",
  },
  {
    n: "03",
    k: "Built for consistency",
    v: "Sessions sized for real schedules. Clients train year after year.",
  },
];

export function Trust() {
  return (
    <section id="about" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <div className="grid gap-14 md:grid-cols-[1fr_1.3fr] md:gap-20">
          <div>
            <div className="overflow-hidden rounded-sm border border-border">
              <img
                src={coachPortrait}
                alt="Alex Moreno portrait"
                loading="lazy"
                width={896}
                height={1120}
                className="h-full w-full object-cover"
                style={{ aspectRatio: "4/5" }}
              />
            </div>
            <div className="mt-6 border-l-2 border-accent pl-4">
              <p className="font-display text-lg font-semibold">Alex Moreno</p>
              <p className="text-sm text-muted-foreground">
                Strength &amp; Conditioning Coach · Barcelona
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <p className="mb-4 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              <span className="h-px w-10 bg-accent" />
              About the coach
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Direct coaching.
              <br />
              Measured progress.
            </h2>
            <ul className="mt-10">
              {BULLETS.map((b) => (
                <li
                  key={b.n}
                  className="grid grid-cols-[40px_160px_1fr] items-baseline gap-6 border-t border-border py-6 last:border-b"
                >
                  <span className="font-display text-xs font-semibold tracking-wider text-accent">
                    {b.n}
                  </span>
                  <span className="font-display text-sm font-semibold uppercase tracking-wider">
                    {b.k}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{b.v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-sm border border-border">
            <img
              src={studioWide}
              alt="The strength studio in Barcelona"
              loading="lazy"
              width={1600}
              height={1000}
              className="h-full w-full object-cover"
              style={{ aspectRatio: "16/10" }}
            />
          </div>
          <div className="overflow-hidden rounded-sm border border-border">
            <img
              src={outdoorBarcelona}
              alt="Outdoor training at Barceloneta beach"
              loading="lazy"
              width={1600}
              height={1000}
              className="h-full w-full object-cover"
              style={{ aspectRatio: "16/10" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
