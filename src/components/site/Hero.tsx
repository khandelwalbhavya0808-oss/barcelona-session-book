import coachPortrait from "@/assets/coach-portrait.jpg";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section id="top" className="relative border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.15fr_1fr] md:gap-16 md:py-28">
        <div className="flex flex-col justify-center">
          <p className="mb-6 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <span className="h-px w-10 bg-accent" />
            Personal Training · Barcelona
          </p>
          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02] tracking-tight sm:text-5xl md:text-[4rem]">
            Build real strength.
            <br />
            Train consistently.
            <br />
            <span className="text-accent">In the studio or outside.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-[17px]">
            Structured 1:1 sessions for busy professionals — indoors at the
            studio or outdoors across Barcelona's parks, beach and urban spaces.
          </p>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground/80">
            Efficient programming. Direct coaching. No filler.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <a
              href="#book"
              className="inline-flex h-12 items-center rounded-sm bg-accent px-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-accent-foreground transition-opacity hover:opacity-90"
            >
              Book Your Session
            </a>
            <a
              href="#schedule"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
            >
              See this week's schedule
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="relative md:pl-4">
          <div className="relative overflow-hidden rounded-sm border border-border">
            <img
              src={coachPortrait}
              alt="Alex Moreno, Strength & Conditioning Coach in Barcelona"
              width={896}
              height={1120}
              className="h-full w-full object-cover"
              style={{ aspectRatio: "4/5" }}
            />
          </div>
          <span
            aria-hidden
            className="absolute -bottom-2 -left-2 h-10 w-10 border-b-2 border-l-2 border-accent"
          />
          <span
            aria-hidden
            className="absolute -right-2 -top-2 h-10 w-10 border-r-2 border-t-2 border-accent"
          />
        </div>
      </div>
    </section>
  );
}
