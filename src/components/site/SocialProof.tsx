import c1 from "@/assets/community-1.jpg";
import c2 from "@/assets/community-2.jpg";
import c3 from "@/assets/community-3.jpg";
import c4 from "@/assets/community-4.jpg";

const TESTIMONIALS = [
  {
    quote:
      "Sessions are tight, structured and I actually see progress. No wasted time.",
    name: "Marta",
    age: 34,
    role: "Product Manager",
  },
  {
    quote:
      "Training outdoors three mornings a week changed how I start my day.",
    name: "Daniel",
    age: 38,
    role: "Architect",
  },
  {
    quote:
      "Calm, clear and demanding when it counts. Best coach I've worked with.",
    name: "Sofía",
    age: 31,
    role: "Lawyer",
  },
];

const PHOTOS = [
  { src: c1, alt: "Sprint training in Ciutadella park" },
  { src: c2, alt: "Barbell strength work in the studio" },
  { src: c3, alt: "Mobility session in the studio" },
  { src: c4, alt: "Kettlebell training at Barceloneta beach" },
];

export function SocialProof() {
  return (
    <section id="reviews" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-4 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              <span className="h-px w-10 bg-accent" />
              Reviews
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Trained consistently. For years.
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="relative flex flex-col justify-between gap-8 rounded-sm border border-border bg-surface p-8"
            >
              <span
                aria-hidden
                className="absolute right-6 top-2 font-display text-7xl leading-none text-accent/30"
              >
                "
              </span>
              <blockquote className="font-display text-lg font-medium leading-snug">
                {t.quote}
              </blockquote>
              <figcaption className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="text-foreground">{t.name}</span>, {t.age} ·{" "}
                {t.role}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          {PHOTOS.map((p) => (
            <div
              key={p.alt}
              className="overflow-hidden rounded-sm border border-border"
            >
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                style={{ aspectRatio: "1/1" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
