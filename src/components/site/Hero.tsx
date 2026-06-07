import { Placeholder } from "./Placeholder";

export function Hero() {
  return (
    <section id="top" className="border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-28 md:gap-14">
        <div className="flex flex-col justify-center">
          <p className="mb-5 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <span className="h-px w-8 bg-accent" />
            Personal Training · Barcelona
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-6xl">
            Build real strength.
            <br />
            Train consistently.
            <br />
            <span className="text-accent">In the studio or outside.</span>
          </h1>
          <p className="mt-6 max-w-lg text-base text-muted-foreground sm:text-lg">
            Structured 1:1 sessions for busy professionals — indoors at the studio
            or outdoors across Barcelona's parks, beach and urban spaces.
          </p>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground">
            Efficient programming. Direct coaching. No filler.
          </p>
          <div className="mt-8">
            <a
              href="#book"
              className="inline-flex h-12 items-center rounded-md bg-accent px-6 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Book Your Session
            </a>
          </div>
        </div>
        <div className="md:pl-4">
          <Placeholder label="Coach Portrait · 4:5" ratio="4/5" />
        </div>
      </div>
    </section>
  );
}
