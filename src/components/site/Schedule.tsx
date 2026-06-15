import { MapPin, Clock, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";

interface SessionWithDetails {
  id: string;
  start_time: string;
  end_time: string;
  max_slots: number;
  location_name: string;
  session_types: {
    title: string;
    focus: string;
    location_type: string;
    duration_minutes: number;
  };
  bookings: {
    id: string;
    status: string;
  }[];
}

function Row({ session }: { session: SessionWithDetails }) {
  const confirmedBookings = session.bookings?.filter((b) => b.status === "confirmed") || [];
  const isOpen = confirmedBookings.length < session.max_slots;
  const startDate = new Date(session.start_time);

  const dayStr = format(startDate, "EEE");
  const timeStr = format(startDate, "HH:mm");

  return (
    <div className="group grid grid-cols-1 items-center gap-4 border-t border-border px-2 py-6 transition-colors hover:bg-surface/60 md:grid-cols-[110px_1.5fr_1fr_1fr_auto] md:gap-6 md:px-4">
      {/* Day + Time */}
      <div className="flex items-baseline gap-3 md:flex-col md:items-start md:gap-1">
        <span className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {dayStr}
        </span>
        <span className="font-display text-2xl font-semibold tabular-nums">{timeStr}</span>
      </div>

      {/* Name + focus */}
      <div>
        <h3 className="font-display text-lg font-semibold leading-tight">
          {session.session_types?.title}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {session.session_types?.focus}
        </p>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-accent" />
        <span>
          <span className="text-foreground">{session.session_types?.location_type}</span>
          <span className="text-muted-foreground"> · {session.location_name}</span>
        </span>
      </div>

      {/* Duration + availability */}
      <div className="flex items-center justify-between gap-4 md:justify-start md:gap-6">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {session.session_types?.duration_minutes} min
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isOpen ? "bg-accent" : "bg-muted-foreground/40"}`}
            aria-hidden
          />
          {isOpen
            ? `${session.max_slots - confirmedBookings.length} Slots Left`
            : "Full (Waitlist)"}
        </span>
      </div>

      {/* CTA */}
      <Link
        to="/sessions/$sessionId"
        params={{ sessionId: session.id }}
        className={`inline-flex h-10 items-center justify-center rounded-sm px-5 text-[12px] font-semibold uppercase tracking-[0.14em] transition ${
          isOpen
            ? "bg-accent text-accent-foreground hover:opacity-90"
            : "border border-border text-muted-foreground hover:border-accent hover:text-accent"
        }`}
      >
        {isOpen ? "Book" : "Waitlist"}
      </Link>
    </div>
  );
}

export function Schedule() {
  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery<SessionWithDetails[]>({
    queryKey: ["scheduled-sessions-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(
          `
          id,
          start_time,
          end_time,
          max_slots,
          location_name,
          session_types (
            title,
            focus,
            location_type,
            duration_minutes
          ),
          bookings (
            id,
            status
          )
        `,
        )
        .eq("status", "active")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as any;
    },
  });

  return (
    <section id="schedule" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-4 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              <span className="h-px w-10 bg-accent" />
              Upcoming Timetable
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Six sessions. Pick yours.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Recurring weekly slots. Single session or a block of four — both available. Full
            timetable on request.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Failed to load scheduled sessions. Please try refreshing.
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No upcoming session slots scheduled. Check back soon!
          </div>
        ) : (
          <div className="border-b border-border">
            {sessions.map((session) => (
              <Row key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
