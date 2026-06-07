import { DAYS, SCHEDULE, type Slot } from "./schedule-data";
import { Clock, MapPin } from "lucide-react";

function FocusChip({ focus }: { focus: Slot["focus"] }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
      {focus}
    </span>
  );
}

function SlotCard({ slot }: { slot: Slot }) {
  return (
    <article className="group flex flex-col gap-3 rounded-md border border-border bg-surface p-3 transition-colors hover:border-accent/60">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold tabular-nums">{slot.time}</span>
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${slot.open ? "bg-accent" : "bg-muted-foreground/40"}`}
            aria-hidden
          />
          {slot.open ? "Open" : "Full"}
        </span>
      </div>
      <div>
        <h3 className="text-[15px] font-semibold leading-tight">{slot.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <FocusChip focus={slot.focus} />
          <span className="inline-flex items-center gap-1 rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {slot.location}
          </span>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {slot.duration}
        </span>
        <a
          href="#book"
          aria-disabled={!slot.open}
          className={`inline-flex h-7 items-center rounded-sm px-2.5 text-[11px] font-semibold uppercase tracking-wider transition ${
            slot.open
              ? "bg-accent text-accent-foreground hover:opacity-90"
              : "pointer-events-none bg-muted text-muted-foreground"
          }`}
        >
          {slot.open ? "Book" : "Waitlist"}
        </a>
      </div>
    </article>
  );
}

export function Schedule() {
  return (
    <section id="schedule" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              This Week
            </p>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Schedule
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Recurring weekly slots. Pick what fits — book a single session or a block.
          </p>
        </div>

        {/* Desktop grid */}
        <div className="hidden grid-cols-6 gap-3 md:grid">
          {DAYS.map((day) => (
            <div key={day} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between border-b border-border pb-2">
                <span className="font-display text-sm font-semibold uppercase tracking-wider">
                  {day}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {SCHEDULE[day].length} slots
                </span>
              </div>
              {SCHEDULE[day].map((slot) => (
                <SlotCard key={`${day}-${slot.time}`} slot={slot} />
              ))}
            </div>
          ))}
        </div>

        {/* Mobile stacked */}
        <div className="space-y-8 md:hidden">
          {DAYS.map((day) => (
            <div key={day}>
              <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
                <span className="font-display text-sm font-semibold uppercase tracking-wider">
                  {day}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {SCHEDULE[day].length} slots
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {SCHEDULE[day].map((slot) => (
                  <SlotCard key={`${day}-${slot.time}`} slot={slot} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
