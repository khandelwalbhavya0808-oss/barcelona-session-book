import { FEATURED_SLOTS, type Slot } from "./schedule-data";
import { MapPin, Clock } from "lucide-react";

function Row({ slot }: { slot: Slot }) {
  return (
    <div className="group grid grid-cols-1 items-center gap-4 border-t border-border px-2 py-6 transition-colors hover:bg-surface/60 md:grid-cols-[110px_1.5fr_1fr_1fr_auto] md:gap-6 md:px-4">
      {/* Day + Time */}
      <div className="flex items-baseline gap-3 md:flex-col md:items-start md:gap-1">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {slot.day}
        </span>
        <span className="font-display text-2xl font-semibold tabular-nums">
          {slot.time}
        </span>
      </div>

      {/* Name + focus */}
      <div>
        <h3 className="font-display text-lg font-semibold leading-tight">
          {slot.name}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {slot.focus}
        </p>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-accent" />
        <span>
          <span className="text-foreground">{slot.location}</span>
          <span className="text-muted-foreground"> · {slot.area}</span>
        </span>
      </div>

      {/* Duration + availability */}
      <div className="flex items-center justify-between gap-4 md:justify-start md:gap-6">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {slot.duration}
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${slot.open ? "bg-accent" : "bg-muted-foreground/40"}`}
            aria-hidden
          />
          {slot.open ? "Open" : "Full"}
        </span>
      </div>

      {/* CTA */}
      <a
        href="#book"
        aria-disabled={!slot.open}
        className={`inline-flex h-10 items-center justify-center rounded-sm px-5 text-[12px] font-semibold uppercase tracking-[0.14em] transition ${
          slot.open
            ? "bg-accent text-accent-foreground hover:opacity-90"
            : "pointer-events-none border border-border text-muted-foreground"
        }`}
      >
        {slot.open ? "Book" : "Waitlist"}
      </a>
    </div>
  );
}

export function Schedule() {
  return (
    <section id="schedule" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-4 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              <span className="h-px w-10 bg-accent" />
              This Week
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Six sessions. Pick yours.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Recurring weekly slots. Single session or a block of four — both
            available. Full timetable on request.
          </p>
        </div>

        <div className="border-b border-border">
          {FEATURED_SLOTS.map((slot) => (
            <Row key={`${slot.day}-${slot.time}`} slot={slot} />
          ))}
        </div>
      </div>
    </section>
  );
}
