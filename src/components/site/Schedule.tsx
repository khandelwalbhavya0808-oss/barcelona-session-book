import {
  MapPin,
  Clock,
  Loader2,
  Grid,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns";

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

const BARCELONA_TIMEZONE = "Europe/Madrid";

const getBarcelonaDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: BARCELONA_TIMEZONE,
  }).format(date);
};

const formatBarcelonaTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BARCELONA_TIMEZONE,
  }).format(date);
};

const getFocusStyle = (focus: string) => {
  switch (focus) {
    case "Strength":
      return "bg-accent/10 text-accent border border-accent/20";
    case "Conditioning":
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    case "Mobility":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
};

const formatWeekRange = (monday: Date, sunday: Date) => {
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  const sameMonth = monday.getMonth() === sunday.getMonth();

  if (sameYear) {
    if (sameMonth) {
      return `${format(monday, "MMM d")} - ${format(sunday, "d, yyyy")}`;
    }
    return `${format(monday, "MMM d")} - ${format(sunday, "MMM d, yyyy")}`;
  }
  return `${format(monday, "MMM d, yyyy")} - ${format(sunday, "MMM d, yyyy")}`;
};

function CapacityIndicator({
  confirmedCount,
  maxSlots,
}: {
  confirmedCount: number;
  maxSlots: number;
}) {
  const dots = [];
  const displayLimit = Math.min(maxSlots, 10);
  const isCapped = maxSlots > 10;

  for (let i = 0; i < displayLimit; i++) {
    const isBooked = i < confirmedCount;
    dots.push(
      <span
        key={i}
        className={`inline-block h-1.5 w-1.5 rounded-full border transition-all duration-300 ${
          isBooked ? "bg-accent border-accent" : "bg-transparent border-muted-foreground/30"
        }`}
      />,
    );
  }

  const remaining = maxSlots - confirmedCount;

  return (
    <div className="flex flex-col gap-1 md:items-start">
      <div className="flex items-center gap-1 h-3 flex-wrap">
        {dots}
        {isCapped && (
          <span className="text-[10px] text-muted-foreground font-semibold leading-none">+</span>
        )}
      </div>
      <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-muted-foreground">
        {remaining > 0 ? `${remaining} Slots Left` : "Full (Waitlist)"}
      </span>
    </div>
  );
}

function Row({ session }: { session: SessionWithDetails }) {
  const confirmedBookings = session.bookings?.filter((b) => b.status === "confirmed") || [];
  const isOpen = confirmedBookings.length < session.max_slots;
  const timeStr = formatBarcelonaTime(session.start_time);

  return (
    <div className="group grid grid-cols-1 items-center gap-4 border-t border-border/60 px-2 py-5 transition-all duration-300 hover:bg-surface/40 md:grid-cols-[100px_1.5fr_1fr_1fr_auto] md:gap-6 md:px-4">
      <div className="flex items-baseline gap-2 md:flex-col md:items-start md:gap-0">
        <span className="font-display text-2xl font-semibold tabular-nums tracking-tight">
          {timeStr}
        </span>
      </div>

      <div className="flex flex-col gap-2 md:gap-1.5">
        <h3 className="font-display text-base font-semibold leading-tight group-hover:text-accent transition-colors duration-300">
          {session.session_types?.title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getFocusStyle(session.session_types?.focus)}`}
          >
            {session.session_types?.focus}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            {session.session_types?.duration_minutes} min
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="leading-snug">
          <span className="text-foreground font-medium">
            {session.session_types?.location_type}
          </span>
          <span className="text-muted-foreground/80"> · {session.location_name}</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 md:justify-start md:gap-6">
        <CapacityIndicator confirmedCount={confirmedBookings.length} maxSlots={session.max_slots} />
      </div>

      <Link
        to="/sessions/$sessionId"
        params={{ sessionId: session.id }}
        className={`inline-flex h-9 items-center justify-center rounded-sm px-5 text-[11px] font-semibold uppercase tracking-[0.14em] transition-all duration-300 ${
          isOpen
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "border border-border text-muted-foreground hover:border-accent hover:text-accent"
        }`}
      >
        {isOpen ? "Book" : "Waitlist"}
      </Link>
    </div>
  );
}

function CalendarCard({ session }: { session: SessionWithDetails }) {
  const confirmedBookings = session.bookings?.filter((b) => b.status === "confirmed") || [];
  const isOpen = confirmedBookings.length < session.max_slots;
  const timeStr = formatBarcelonaTime(session.start_time);

  return (
    <div className="group border border-border/80 bg-surface/50 p-3 rounded-lg hover:border-accent hover:shadow-sm cursor-pointer transition-all duration-300 flex flex-col justify-between gap-2.5">
      <div>
        <div className="flex items-center justify-between gap-1 flex-wrap">
          <span className="font-display text-sm font-semibold tabular-nums tracking-tight">
            {timeStr}
          </span>
          <span
            className={`inline-flex items-center rounded-sm px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider ${getFocusStyle(session.session_types?.focus)}`}
          >
            {session.session_types?.focus}
          </span>
        </div>

        <h4 className="font-display font-semibold text-xs text-foreground mt-1.5 leading-snug group-hover:text-accent transition-colors duration-300">
          {session.session_types?.title}
        </h4>

        <span className="block text-[10px] text-muted-foreground mt-1 font-medium">
          {session.session_types?.duration_minutes} min · {session.location_name}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
          {session.max_slots - confirmedBookings.length} left
        </span>

        <Link
          to="/sessions/$sessionId"
          params={{ sessionId: session.id }}
          className={`inline-flex h-6 items-center justify-center rounded-sm px-2 text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
            isOpen
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "border border-border text-muted-foreground hover:border-accent hover:text-accent"
          }`}
        >
          {isOpen ? "Book" : "Waitlist"}
        </Link>
      </div>
    </div>
  );
}

export function Schedule() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"grid" | "calendar">("grid");

  const [dayFilter, setDayFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
  const sunday = endOfWeek(currentDate, { weekStartsOn: 1 });

  const {
    data: sessions,
    isLoading,
    error,
  } = useQuery<SessionWithDetails[]>({
    queryKey: ["scheduled-sessions-public", monday.toISOString()],
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
        .gte("start_time", startOfDay(monday).toISOString())
        .lte("start_time", endOfDay(sunday).toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as any;
    },
  });

  const filteredSessions = (sessions || []).filter((session) => {
    const sessionDate = new Date(session.start_time);

    if (dayFilter !== "all") {
      const weekday = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: BARCELONA_TIMEZONE,
      }).format(sessionDate);
      if (weekday !== dayFilter) return false;
    }

    if (categoryFilter !== "all" && session.session_types?.focus !== categoryFilter) {
      return false;
    }

    if (locationFilter !== "all" && session.session_types?.location_type !== locationFilter) {
      return false;
    }

    return true;
  });

  const groupsMap: { [key: string]: SessionWithDetails[] } = {};
  const orderOfDays: string[] = [];

  filteredSessions.forEach((session) => {
    const label = getBarcelonaDateLabel(session.start_time);
    if (!groupsMap[label]) {
      groupsMap[label] = [];
      orderOfDays.push(label);
    }
    groupsMap[label].push(session);
  });

  const weekDays = eachDayOfInterval({ start: monday, end: sunday });

  const hasActiveFilters =
    dayFilter !== "all" || categoryFilter !== "all" || locationFilter !== "all";

  return (
    <section id="schedule" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-28">
        <div className="mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Weekly Schedule
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground mt-2">
              Small groups. Focused sessions. Pick what works for your week.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-end bg-surface border border-border p-1 rounded-lg">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold px-2 tabular-nums">
              {formatWeekRange(monday, sunday)}
            </span>
            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-2 hover:bg-background rounded-md text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-background rounded-md text-foreground cursor-pointer transition-colors"
            >
              Today
            </button>
          </div>
        </div>

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex items-center bg-surface border border-border p-1 rounded-lg self-start">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Grid View
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Calendar View
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-accent" /> Filters:
            </span>

            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="bg-surface border border-border text-foreground px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer focus:border-accent outline-none hover:border-accent/60 transition-colors"
            >
              <option value="all">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface border border-border text-foreground px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer focus:border-accent outline-none hover:border-accent/60 transition-colors"
            >
              <option value="all">All Categories</option>
              <option value="Strength">Strength</option>
              <option value="Conditioning">Conditioning</option>
              <option value="Mobility">Mobility</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-surface border border-border text-foreground px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer focus:border-accent outline-none hover:border-accent/60 transition-colors"
            >
              <option value="all">All Locations</option>
              <option value="Studio">Studio</option>
              <option value="Outdoor">Outdoor</option>
            </select>
          </div>
        </div>

        <div className="border border-border/80 rounded-xl p-6 bg-surface/10">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : error ? (
            <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-6 text-center text-sm text-destructive">
              Failed to load scheduled sessions. Please try refreshing.
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="rounded-full bg-surface p-4 mb-4 border border-border">
                <Calendar className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {hasActiveFilters
                  ? "No sessions found matching your filters."
                  : "No upcoming session slots scheduled for this week."}
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                {hasActiveFilters
                  ? "Try choosing different filter criteria or reset them."
                  : "Check back soon or request a custom schedule."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setDayFilter("all");
                    setCategoryFilter("all");
                    setLocationFilter("all");
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-sm border border-border px-6 text-xs font-semibold uppercase tracking-wider text-foreground hover:border-accent hover:text-accent transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="space-y-12">
              {orderOfDays.map((dayLabel) => (
                <div key={dayLabel} className="first:mt-0">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                      {dayLabel}
                    </h3>
                  </div>
                  <div className="border-b border-border/60">
                    {groupsMap[dayLabel].map((session) => (
                      <Row key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const dayLabel = new Intl.DateTimeFormat("en-US", {
                  weekday: "short",
                  timeZone: BARCELONA_TIMEZONE,
                }).format(day);
                const dateNum = new Intl.DateTimeFormat("en-US", {
                  day: "numeric",
                  timeZone: BARCELONA_TIMEZONE,
                }).format(day);
                const daySessions = filteredSessions.filter((s) =>
                  isSameDay(new Date(s.start_time), day),
                );
                const dayIsToday = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`rounded-lg border p-4 bg-surface/20 flex flex-col min-h-[300px] transition-all duration-300 ${
                      dayIsToday ? "border-accent/40 bg-surface/30 shadow-sm" : "border-border/60"
                    }`}
                  >
                    <div className="text-center pb-3 border-b border-border/40 mb-3 flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {dayLabel}
                      </span>
                      <span
                        className={`text-lg font-bold tabular-nums mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full ${
                          dayIsToday
                            ? "bg-accent text-accent-foreground font-semibold"
                            : "text-foreground font-semibold"
                        }`}
                      >
                        {dateNum}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      {daySessions.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/30 font-medium">
                            No sessions
                          </span>
                        </div>
                      ) : (
                        daySessions.map((session) => (
                          <CalendarCard key={session.id} session={session} />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground/80 mt-4 text-center italic">
          * All sessions are scheduled in Barcelona time (CET/CEST).
        </p>

        <div className="mt-12 bg-surface/30 border border-accent/10 rounded-lg p-6 text-center max-w-2xl mx-auto">
          <h4 className="font-display font-semibold text-lg text-foreground">
            Looking for something more personal?
          </h4>
          <p className="text-sm text-muted-foreground mt-2">
            Private 1:1 sessions and custom group training are available on request.{" "}
            <a href="#book" className="text-accent font-semibold hover:underline transition-all">
              Contact Alex
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
