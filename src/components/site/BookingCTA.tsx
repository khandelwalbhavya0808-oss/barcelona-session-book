export function BookingCTA() {
  return (
    <section id="book" className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 md:py-36">
        <div className="max-w-3xl">
          <p className="mb-5 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <span className="h-px w-10 bg-accent" />
            Book
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Reserve a session.
            <br />
            <span className="text-accent">Or reschedule an existing one.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            One session to try it. Or a weekly block. Studio or outdoor — your
            call.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#schedule"
              className="inline-flex h-12 items-center rounded-sm bg-accent px-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-accent-foreground transition-opacity hover:opacity-90"
            >
              Book a Session
            </a>
            <a
              href="#book"
              className="inline-flex h-12 items-center rounded-sm border border-border px-7 text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              Reschedule
            </a>
          </div>

          <dl className="mt-14 grid gap-8 border-t border-border pt-8 sm:grid-cols-3">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Response time
              </dt>
              <dd className="mt-2 font-display text-base font-semibold">
                Within 24 hours
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Cancellation
              </dt>
              <dd className="mt-2 font-display text-base font-semibold">
                Free up to 12h before
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Outdoor radius
              </dt>
              <dd className="mt-2 font-display text-base font-semibold">
                Central Barcelona
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
