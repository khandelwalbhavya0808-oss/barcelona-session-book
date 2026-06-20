import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Loader2,
  ArrowLeft,
  Grid,
  List,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Compass,
  DollarSign,
  Info,
  CalendarDays,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  isBefore,
  startOfDay,
} from "date-fns";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const bookSearchSchema = z.object({
  sessionId: z.string().optional(),
});

export const Route = createFileRoute("/client/book")({
  validateSearch: (search) => bookSearchSchema.parse(search),
  component: ClientBookingPage,
});

function ClientBookingPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sessionId: querySessionId } = Route.useSearch();

  // Navigation states
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filter states
  const [focusFilter, setFocusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Booking drawer states
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<"book" | "waitlist">("book");

  // Query: Fetch scheduled sessions (active, future)
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["client-bookable-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(
          `
          *,
          session_types (
            id,
            title,
            description,
            focus,
            location_type,
            pricing,
            duration_minutes
          ),
          bookings (
            id,
            client_id,
            status,
            payment_status
          ),
          waitlists (
            id,
            client_id,
            status,
            position
          )
        `,
        )
        .eq("status", "active")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });

  // Query: Fetch client's existing bookings for conflict checks
  const { data: clientBookings, isLoading: clientBookingsLoading } = useQuery({
    queryKey: ["client-bookings-conflict-check", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          scheduled_session_id,
          scheduled_sessions (
            start_time,
            end_time,
            session_types (
              title
            )
          )
        `,
        )
        .eq("client_id", user?.id || "")
        .in("status", ["confirmed", "attended"]);

      if (error) throw error;
      return data as any[];
    },
  });

  const isLoading = authLoading || sessionsLoading || clientBookingsLoading;

  // Auto-select and trigger confirmation modal if sessionId is passed in query
  useEffect(() => {
    if (querySessionId && sessions && sessions.length > 0 && !selectedSession) {
      const matchingSession = sessions.find((s) => s.id === querySessionId);
      if (matchingSession) {
        setSelectedSession(matchingSession);
        setIsDrawerOpen(true);

        const sessionDate = new Date(matchingSession.start_time);
        setSelectedDate(sessionDate);
        setCurrentMonth(sessionDate);

        // No auto-trigger confirmation modal anymore as the drawer handles confirmation directly
      }
    }
  }, [querySessionId, sessions, selectedSession]);

  // Book session mutation
  const bookMutation = useMutation({
    mutationFn: async (sessId: string) => {
      if (!user) throw new Error("Authentication required.");
      if (profile?.status === "banned" || profile?.status === "rejected") {
        throw new Error("Your account is restricted from making bookings.");
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          scheduled_session_id: sessId,
          client_id: user.id,
          status: "confirmed",
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Session booked successfully! Pay in-person at the venue.");
      queryClient.invalidateQueries({ queryKey: ["client-bookable-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["client-bookings-conflict-check", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-bookings", user?.id] });
      setIsDrawerOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to book session.");
    },
  });

  // Join waitlist mutation
  const waitlistMutation = useMutation({
    mutationFn: async ({
      sessId,
      currentWaitlistCount,
    }: {
      sessId: string;
      currentWaitlistCount: number;
    }) => {
      if (!user) throw new Error("Authentication required.");
      if (profile?.status === "banned" || profile?.status === "rejected") {
        throw new Error("Your account is restricted from joining waitlists.");
      }

      const position = currentWaitlistCount + 1;

      const { data, error } = await supabase
        .from("waitlists")
        .insert({
          scheduled_session_id: sessId,
          client_id: user.id,
          status: "waiting",
          position: position,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Joined waitlist! You'll be automatically booked if a slot opens up.");
      queryClient.invalidateQueries({ queryKey: ["client-bookable-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-waitlists", user?.id] });
      setIsDrawerOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to join waitlist.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Filter logic
  const filteredSessions = (sessions || []).filter((sess) => {
    const focus = sess.session_types?.focus || "";
    const locType = sess.session_types?.location_type || "";

    if (focusFilter !== "all" && focus !== focusFilter) return false;
    if (locationFilter !== "all" && locType !== locationFilter) return false;

    return true;
  });

  // Extract unique filters
  const focusOptions = Array.from(
    new Set((sessions || []).map((s) => s.session_types?.focus).filter(Boolean)),
  );
  const locationOptions = Array.from(
    new Set((sessions || []).map((s) => s.session_types?.location_type).filter(Boolean)),
  );

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Get sessions of selected date
  const selectedDateSessions = filteredSessions.filter((sess) =>
    isSameDay(new Date(sess.start_time), selectedDate),
  );

  // Check overlap helper
  const checkOverlap = (session: any) => {
    if (!session || !clientBookings) return null;
    const sessionStart = new Date(session.start_time).getTime();
    const sessionEnd = new Date(session.end_time).getTime();

    for (const b of clientBookings) {
      if (b.scheduled_session_id === session.id) continue;
      const bStart = new Date(b.scheduled_sessions?.start_time).getTime();
      const bEnd = new Date(b.scheduled_sessions?.end_time).getTime();

      // Overlap formula: (startA < endB) && (endA > startB)
      if (sessionStart < bEnd && sessionEnd > bStart) {
        return b.scheduled_sessions?.session_types?.title || "Another Session";
      }
    }
    return null;
  };

  const handleOpenDrawer = (session: any) => {
    setSelectedSession(session);
    setIsDrawerOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedSession) return;

    const confirmedBookings =
      selectedSession.bookings?.filter((b: any) => b.status === "confirmed") || [];
    const isFull = confirmedBookings.length >= (selectedSession.max_slots || 0);

    if (isFull) {
      const activeWaitlist =
        selectedSession.waitlists?.filter((w: any) => w.status === "waiting") || [];
      waitlistMutation.mutate({
        sessId: selectedSession.id,
        currentWaitlistCount: activeWaitlist.length,
      });
    } else {
      bookMutation.mutate(selectedSession.id);
    }
  };

  // Helper values for active session
  const activeBookings =
    selectedSession?.bookings?.filter((b: any) => b.status === "confirmed") || [];
  const activeWaitlist =
    selectedSession?.waitlists?.filter((w: any) => w.status === "waiting") || [];
  const isFull = activeBookings.length >= (selectedSession?.max_slots || 0);
  const hasBooked = user ? activeBookings.some((b: any) => b.client_id === user.id) : false;
  const hasWaitlisted = user ? activeWaitlist.some((w: any) => w.client_id === user.id) : false;
  const conflictSessionTitle = selectedSession ? checkOverlap(selectedSession) : null;
  const myBookingsCount =
    user && selectedSession
      ? selectedSession.bookings?.filter(
          (b: any) => b.client_id === user.id && b.status === "confirmed",
        ).length || 0
      : 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <Link
            to="/client/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3 w-3 text-accent" /> Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Book a Workout</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick your training slots and schedule your weekly personal coaching.
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center self-start sm:self-center bg-surface border border-border p-1.5 rounded-lg shadow-sm">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              viewMode === "calendar"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid className="h-3.5 w-3.5" /> Calendar
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List View
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-4 bg-surface/50 border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Compass className="h-4 w-4 text-accent" /> Filter Sessions:
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Focus Pills */}
          <button
            onClick={() => setFocusFilter("all")}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
              focusFilter === "all"
                ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                : "border-border hover:border-muted-foreground/35 bg-background text-muted-foreground"
            }`}
          >
            All Focuses
          </button>
          {focusOptions.map((option: any) => (
            <button
              key={option}
              onClick={() => setFocusFilter(option)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                focusFilter === option
                  ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                  : "border-border hover:border-muted-foreground/35 bg-background text-muted-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-border hidden md:block" />

        <div className="flex flex-wrap gap-2">
          {/* Location Pills */}
          <button
            onClick={() => setLocationFilter("all")}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
              locationFilter === "all"
                ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                : "border-border hover:border-muted-foreground/35 bg-background text-muted-foreground"
            }`}
          >
            All Locations
          </button>
          {locationOptions.map((option: any) => (
            <button
              key={option}
              onClick={() => setLocationFilter(option)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                locationFilter === option
                  ? "bg-accent/15 text-accent border-accent/40 font-semibold"
                  : "border-border hover:border-muted-foreground/35 bg-background text-muted-foreground"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Areas based on Switcher */}
      {viewMode === "calendar" ? (
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
          {/* Left Grid: Calendar Month Component */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg text-foreground">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 border border-border rounded-md hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 border border-border rounded-md hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Days grid headers */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            {/* Calendar Days cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate);
                const daySessions = filteredSessions.filter((s) =>
                  isSameDay(new Date(s.start_time), day),
                );
                const hasSessions = daySessions.length > 0;
                const inMonth = day.getMonth() === currentMonth.getMonth();

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[70px] p-2 flex flex-col justify-between items-start rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-accent/15 border-accent text-accent shadow-sm"
                        : inMonth
                          ? "bg-background border-border hover:border-accent/40 text-foreground"
                          : "bg-background/25 border-border/30 text-muted-foreground/35 cursor-default"
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-sm ${
                        isToday(day) ? "bg-accent text-accent-foreground" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Badge/Dot Indicators */}
                    {hasSessions && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline-block">
                          {daySessions.length} Class
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Grid: Day Selected Timetable Panel */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-accent" /> Available on{" "}
                {format(selectedDate, "MMM d, yyyy")}
              </h2>

              {selectedDateSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-border py-16 text-center rounded-xl bg-background/20">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No sessions scheduled</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs px-4">
                    There are no workout timetables available for this day. Select another day on
                    the calendar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  {selectedDateSessions.map((session) => {
                    const bookingsCount =
                      session.bookings?.filter((b: any) => b.status === "confirmed").length || 0;
                    const sessionFull = bookingsCount >= session.max_slots;
                    const alreadyBooked =
                      user &&
                      session.bookings?.some(
                        (b: any) => b.client_id === user.id && b.status === "confirmed",
                      );

                    return (
                      <div
                        key={session.id}
                        onClick={() => handleOpenDrawer(session)}
                        className="group border border-border/80 bg-background/60 p-4 rounded-lg hover:border-accent hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between gap-3"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="inline-block text-[9px] uppercase tracking-wider text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-sm">
                              {session.session_types?.focus}
                            </span>
                            <h3 className="font-display font-bold text-sm text-foreground mt-1.5 leading-tight group-hover:text-accent transition-colors">
                              {session.session_types?.title}
                            </h3>
                          </div>

                          <span
                            className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm border shrink-0 ${
                              alreadyBooked
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : sessionFull
                                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                  : "bg-accent/10 border-accent/20 text-accent"
                            }`}
                          >
                            {alreadyBooked ? "Booked" : sessionFull ? "Waitlist" : "Open"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border/40">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(session.start_time), "HH:mm")} (
                            {session.session_types?.duration_minutes}m)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {session.location_name}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-border/40 pt-4 text-xs text-muted-foreground flex items-center gap-2 leading-relaxed">
              <Info className="h-4 w-4 text-accent shrink-0" />
              <span>
                Click on any session card to view workout descriptions, pricing details, and
                complete your reservation.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* List View Component (Chronological Timeline) */
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border py-16 text-center rounded-xl bg-background/20">
              <CalendarIcon className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm font-semibold text-foreground">No sessions match filters</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs px-4">
                Try selecting a different filter above to view available fitness workouts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40 space-y-4">
              {filteredSessions.map((session, idx) => {
                const bookingsCount =
                  session.bookings?.filter((b: any) => b.status === "confirmed").length || 0;
                const sessionFull = bookingsCount >= session.max_slots;
                const alreadyBooked =
                  user &&
                  session.bookings?.some(
                    (b: any) => b.client_id === user.id && b.status === "confirmed",
                  );

                return (
                  <div
                    key={session.id}
                    onClick={() => handleOpenDrawer(session)}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-background/20 p-4 rounded-xl transition-all duration-300 ${
                      idx > 0 ? "pt-4" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/15 px-2 py-0.5 rounded">
                          {session.session_types?.focus}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          €{Number(session.pricing).toFixed(2)} In-Person
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-foreground pt-1">
                        {session.session_types?.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-background border border-border/50 px-2 py-1 rounded-md">
                          <CalendarIcon className="h-3.5 w-3.5 text-accent" />
                          {format(new Date(session.start_time), "EEEE, MMMM d 'at' HH:mm")}
                        </span>
                        <span className="flex items-center gap-1.5 bg-background border border-border/50 px-2 py-1 rounded-md">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                          {session.session_types?.duration_minutes} min
                        </span>
                        <span className="flex items-center gap-1.5 bg-background border border-border/50 px-2 py-1 rounded-md">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          {session.location_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded border ${
                          alreadyBooked
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : sessionFull
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-accent/10 border-accent/20 text-accent"
                        }`}
                      >
                        {alreadyBooked
                          ? "Already Booked"
                          : sessionFull
                            ? "Waitlist Queue"
                            : "Slots Open"}
                      </span>
                      <button className="h-9 px-4 rounded-md bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity">
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Details Side-Drawer/Sheet */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        {selectedSession && (
          <SheetContent
            side="right"
            className="bg-surface border-border flex flex-col justify-between h-full w-full sm:max-w-md text-foreground"
          >
            <div className="flex flex-col justify-between h-full bg-surface">
              <div className="space-y-6">
                {/* Header */}
                <div>
                  <h2 className="font-display text-2xl font-black italic tracking-wide text-foreground uppercase">
                    CONFIRM YOUR SESSION
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Ready to level up? Review the details below to secure your spot.
                  </p>
                </div>

                {/* Already booked helper notice */}
                {myBookingsCount > 0 && (
                  <div className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>
                      You have booked {myBookingsCount} slot{myBookingsCount > 1 ? "s" : ""} for
                      this session. You can book another below.
                    </span>
                  </div>
                )}

                {/* Card 1: Session Details Card */}
                <div className="bg-background border border-border p-4 rounded-xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground font-black text-lg shrink-0">
                      {selectedSession.session_types?.focus?.[0] || "S"}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-foreground uppercase tracking-wide leading-tight">
                        {selectedSession.session_types?.title}
                      </h3>
                      <span className="text-[11px] uppercase tracking-wider text-accent font-bold mt-0.5 block">
                        {selectedSession.session_types?.focus}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-accent shrink-0" />
                      <span className="font-semibold text-foreground">
                        {format(new Date(selectedSession.start_time), "MMM d, yyyy")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-accent shrink-0" />
                      <span className="font-semibold text-foreground">
                        {format(new Date(selectedSession.start_time), "HH:mm")}
                      </span>
                      <span>({selectedSession.session_types?.duration_minutes} min)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent shrink-0" />
                      <span className="font-semibold text-foreground truncate">
                        {selectedSession.location_name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Investment/Pricing Card */}
                <div className="bg-background border border-border p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-accent">
                      TOTAL INVESTMENT
                    </span>
                    <span className="text-xs text-muted-foreground italic mt-0.5 block">
                      Pay in-person at arrival
                    </span>
                  </div>
                  <span className="font-display text-2xl font-black italic tracking-wide text-foreground">
                    €{Number(selectedSession.pricing).toFixed(2)}
                  </span>
                </div>

                {/* Card 3: Cancellation policy info */}
                <div className="bg-background/50 border border-border p-4 rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground leading-normal">
                  <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p>
                    By confirming, you agree to our 24-hour cancellation policy. Sessions cancelled
                    within 24 hours may still be charged.
                  </p>
                </div>

                {/* Conflict alerts */}
                {conflictSessionTitle && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300 leading-normal">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-bold">Schedule Overlap Warning</span>
                      <p className="mt-0.5 opacity-90">
                        You already have a booked session (<strong>{conflictSessionTitle}</strong>)
                        that overlaps with this slot's time.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-border/40 pt-5 mt-6 space-y-4">
                <button
                  onClick={handleConfirmAction}
                  disabled={bookMutation.isPending || waitlistMutation.isPending}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-bold text-sm uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {bookMutation.isPending || waitlistMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      {isFull ? "Confirm Waitlist" : "Confirm Booking"}
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors py-2 cursor-pointer"
                >
                  BACK TO SCHEDULE
                </button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
