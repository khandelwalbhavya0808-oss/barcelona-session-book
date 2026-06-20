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
import { useState } from "react";
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

export const Route = createFileRoute("/client/book")({
  component: ClientBookingPage,
});

function ClientBookingPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const handleActionClick = (type: "book" | "waitlist") => {
    setActionType(type);
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    setConfirmOpen(false);
    if (!selectedSession) return;

    if (actionType === "book") {
      bookMutation.mutate(selectedSession.id);
    } else {
      const activeWaitlist =
        selectedSession.waitlists?.filter((w: any) => w.status === "waiting") || [];
      waitlistMutation.mutate({
        sessId: selectedSession.id,
        currentWaitlistCount: activeWaitlist.length,
      });
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
            className="bg-surface border-border flex flex-col justify-between h-full w-full sm:max-w-md"
          >
            <div className="space-y-6">
              <SheetHeader className="text-left border-b border-border/40 pb-5">
                <span className="inline-flex self-start items-center gap-1.5 rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                  {selectedSession.session_types?.focus}
                </span>
                <SheetTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
                  {selectedSession.session_types?.title}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground text-sm mt-2">
                  {selectedSession.session_types?.description ||
                    "No workout description provided for this session."}
                </SheetDescription>
              </SheetHeader>

              {/* Logistics information */}
              <div className="space-y-4 text-sm pt-2">
                <div className="flex items-center gap-3 p-3 bg-background/50 border border-border/40 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                      Date & Time
                    </span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(selectedSession.start_time), "EEEE, MMM d, yyyy")}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {format(new Date(selectedSession.start_time), "HH:mm")} -{" "}
                      {format(new Date(selectedSession.end_time), "HH:mm")} (
                      {selectedSession.session_types?.duration_minutes} min)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-background/50 border border-border/40 rounded-lg">
                  <MapPin className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                      Location
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedSession.session_types?.location_type}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {selectedSession.location_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-background/50 border border-border/40 rounded-lg">
                  <DollarSign className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                      Pricing
                    </span>
                    <span className="font-semibold text-foreground">
                      €{Number(selectedSession.pricing).toFixed(2)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Paid on-premises (in-person)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-background/50 border border-border/40 rounded-lg">
                  <Clock className="h-5 w-5 text-accent shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                      Availability
                    </span>
                    <span className="font-semibold text-foreground">
                      {selectedSession.max_slots - activeBookings.length} of{" "}
                      {selectedSession.max_slots} slots available
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {activeWaitlist.length} clients currently in waitlist
                    </span>
                  </div>
                </div>
              </div>

              {/* Conflict alerts */}
              {conflictSessionTitle && !hasBooked && !hasWaitlisted && (
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-300 leading-normal">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold">Schedule Overlap Alert</span>
                    <p className="mt-0.5 opacity-90">
                      You already have a session booked for <strong>{conflictSessionTitle}</strong>{" "}
                      that overlaps with this slot's time.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Booking State CTA Button */}
            <div className="border-t border-border/40 pt-5">
              {hasBooked ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-400">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div>
                    <span className="font-bold">You are booked for this workout!</span>
                    <p className="mt-0.5 opacity-80">
                      Check bookings history in your dashboard settings.
                    </p>
                  </div>
                </div>
              ) : hasWaitlisted ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-muted-foreground/20 bg-muted/20 p-4 text-xs text-foreground">
                  <Clock className="h-5 w-5 shrink-0 text-accent animate-pulse" />
                  <div>
                    <span className="font-bold">You are on the waitlist</span>
                    <p className="mt-0.5 text-muted-foreground">
                      We'll auto-register you if an active client cancels. Current position:{" "}
                      <strong className="text-accent">
                        #{activeWaitlist.findIndex((w: any) => w.client_id === user?.id) + 1}
                      </strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => handleActionClick(isFull ? "waitlist" : "book")}
                    disabled={bookMutation.isPending || waitlistMutation.isPending}
                    className="flex w-full h-11 items-center justify-center rounded-lg bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {bookMutation.isPending || waitlistMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isFull ? (
                      "Join Waitlist Queue"
                    ) : (
                      "Confirm & Book Session"
                    )}
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    {isFull
                      ? "This session is full. Join waitlist position to secure booking on cancel."
                      : "Booking is free. €" +
                        Number(selectedSession.pricing).toFixed(2) +
                        " is due in person at the gym premises."}
                  </p>
                </div>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        {selectedSession && (
          <AlertDialogContent className="bg-surface border border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-xl font-bold">
                {actionType === "book" ? "Confirm Workout Slot" : "Join Workout Waitlist"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-sm space-y-2">
                {actionType === "book" ? (
                  <>
                    <p>
                      Are you sure you want to book{" "}
                      <strong>{selectedSession.session_types?.title}</strong>?
                    </p>
                    <p>
                      <strong>Date:</strong>{" "}
                      {format(new Date(selectedSession.start_time), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p>
                      <strong>Time:</strong> {format(new Date(selectedSession.start_time), "HH:mm")}
                    </p>
                    <p className="pt-2 text-foreground font-semibold">
                      You will pay €{Number(selectedSession.pricing).toFixed(2)} in person at the
                      venue.
                    </p>
                  </>
                ) : (
                  <p>
                    This session is currently full. Join the waitlist at position #
                    {activeWaitlist.length + 1}. You'll be automatically booked if a slot is
                    released.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border border-border text-foreground hover:bg-muted/10 cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAction}
                className="bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
