export function BookingCTA() {
  return (
    <section id="book" className="border-b border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32">
        <div className="max-w-3xl">
          <p className="mb-4 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Book
          </p>
          <h2 className="font-display text-4xl font-semibold leading-[1.05] sm:text-5xl md:text-6xl">
            Pick a slot. <span className="text-accent">Start this week.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base text-muted-foreground">
            One session to try it. Or a weekly block. Studio or outdoor — your call.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#schedule"
              className="inline-flex h-12 items-center rounded-md bg-accent px-6 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
            >
              Book Your Session
            </a>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Replies within 24h
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
