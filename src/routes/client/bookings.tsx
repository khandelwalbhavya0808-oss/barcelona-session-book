import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Info,
  ArrowRight,
} from "lucide-react";
import {
  format,
  differenceInHours,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
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
import { BookingDetailsModal } from "@/components/admin/BookingDetailsModal";

export const Route = createFileRoute("/client/bookings")({
  component: ClientBookingsPage,
});

function ClientBookingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Layout states
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch bookings
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          payment_status,
          created_at,
          scheduled_sessions (
            id,
            start_time,
            end_time,
            location_name,
            session_types (
              title,
              focus,
              pricing,
              duration_minutes
            )
          )
        `,
        )
        .eq("client_id", user?.id || "")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  // Cancel Booking Mutation
  const cancelMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: "cancelled" | "late_cancelled";
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({
          status: status,
          cancelled_at: new Date().toISOString(),
          cancel_reason: "Cancelled by client via dashboard",
        })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(
        data.status === "late_cancelled"
          ? "Booking late-cancelled. Please contact coach for any query."
          : "Booking cancelled successfully!",
      );
      queryClient.invalidateQueries({ queryKey: ["client-bookings", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-bookings", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["client-bookable-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session-details"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel booking.");
    },
  });

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (!selectedBooking) return;

    const sess = selectedBooking.scheduled_sessions;
    const hoursDiff = differenceInHours(new Date(sess.start_time), new Date());
    const isLate = hoursDiff < 12;

    cancelMutation.mutate({
      bookingId: selectedBooking.id,
      status: isLate ? "late_cancelled" : "cancelled",
    });

    setCancelDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-destructive">
        Failed to load bookings. Please try refreshing.
      </div>
    );
  }

  const activeBookings = bookings?.filter((b) => b.status === "confirmed") || [];
  const pastBookings = bookings?.filter((b) => b.status !== "confirmed") || [];

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Get active bookings of selected date
  const selectedDateBookings = activeBookings.filter((b) => {
    const sess = b.scheduled_sessions;
    return sess && isSameDay(new Date(sess.start_time), selectedDate);
  });

  const handleManageClick = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-10 animate-in fade-in duration-500">
      {/* Header and Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            My Bookings
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View your confirmed slots and training history.
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center bg-surface border border-border p-1.5 rounded-lg shadow-sm">
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
        </div>
      </div>

      {viewMode === "list" ? (
        /* List View */
        <div className="space-y-12">
          {/* Section: Active Bookings */}
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-accent" /> Active Bookings (
              {activeBookings.length})
            </h2>

            {activeBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground bg-surface/25">
                No active bookings scheduled.
                <div className="mt-4">
                  <Link
                    to="/client/book"
                    className="inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                  >
                    Find a Slot
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {activeBookings.map((booking) => {
                  const sess = booking.scheduled_sessions;
                  const startDate = new Date(sess.start_time);

                  return (
                    <div
                      key={booking.id}
                      className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-accent/30 transition-all duration-300"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                            {sess.session_types?.focus}
                          </span>
                          <span className="text-[11px] text-muted-foreground uppercase tracking-widest bg-background/50 px-2 py-0.5 border border-border rounded-sm">
                            {booking.payment_status}
                          </span>
                        </div>
                        <h3 className="font-display font-semibold text-lg mt-3 text-foreground">
                          {sess.session_types?.title}
                        </h3>
                        <div className="space-y-2 text-xs text-muted-foreground mt-3">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-accent shrink-0" />
                            <span>{format(startDate, "EEEE, MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-accent shrink-0" />
                            <span>
                              {format(startDate, "HH:mm")} -{" "}
                              {format(new Date(sess.end_time), "HH:mm")} (
                              {sess.session_types?.duration_minutes} min)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-accent shrink-0" />
                            <span>{sess.location_name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-4">
                        <span className="text-sm font-semibold text-foreground">
                          €{Number(sess.session_types?.pricing).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleManageClick(booking)}
                          className="h-8 px-4 rounded-md text-[10px] uppercase font-semibold tracking-wider transition bg-surface border border-border hover:border-accent/40 hover:bg-accent/10 text-foreground cursor-pointer"
                        >
                          Manage Booking
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Past Bookings */}
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-muted-foreground" /> Booking History (
              {pastBookings.length})
            </h2>

            {pastBookings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground bg-surface/10">
                No booking history.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="p-4">Session</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Price</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {pastBookings.map((booking) => {
                      const sess = booking.scheduled_sessions;
                      const startDate = new Date(sess.start_time);

                      let statusColor = "text-muted-foreground bg-muted/10 border-border";
                      if (booking.status === "attended") {
                        statusColor = "text-accent bg-accent/10 border-accent/20";
                      } else if (
                        booking.status === "no-show" ||
                        booking.status === "late_cancelled"
                      ) {
                        statusColor = "text-destructive bg-destructive/10 border-destructive/20";
                      }

                      return (
                        <tr key={booking.id} className="hover:bg-surface/50 transition-colors">
                          <td className="p-4 font-semibold text-foreground">
                            {sess.session_types?.title}
                            <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                              {sess.session_types?.focus}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {format(startDate, "MMM d, yyyy")}
                            <span className="block text-[10px] mt-0.5">
                              {format(startDate, "HH:mm")}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{sess.location_name}</td>
                          <td className="p-4 text-foreground font-semibold">
                            €{Number(sess.session_types?.pricing).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center">
                              <span
                                className={`inline-flex items-center rounded-sm px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border ${statusColor}`}
                              >
                                {booking.status.replace("_", " ")}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Calendar View */
        <div className="grid gap-8 md:grid-cols-[1.5fr_1fr]">
          {/* Left Grid: Calendar Component */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
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

            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
              <div>Sun</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate);
                const dayBookings = activeBookings.filter((b) => {
                  const sess = b.scheduled_sessions;
                  return sess && isSameDay(new Date(sess.start_time), day);
                });
                const hasBookings = dayBookings.length > 0;
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

                    {hasBookings && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline-block">
                          {dayBookings.length} Booked
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Grid: Bookings on selected day */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-accent" /> Booked on{" "}
                {format(selectedDate, "MMM d, yyyy")}
              </h2>

              {selectedDateBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed border-border py-16 text-center rounded-xl bg-background/20">
                  <CalendarIcon className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-semibold text-foreground">No bookings today</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs px-4">
                    You do not have any workouts scheduled for this day. Select another day on the
                    calendar or find new slots.
                  </p>
                  <Link
                    to="/client/book"
                    className="mt-4 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
                  >
                    Book a Workout <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  {selectedDateBookings.map((booking) => {
                    const sess = booking.scheduled_sessions;
                    const startDate = new Date(sess.start_time);

                    return (
                      <div
                        key={booking.id}
                        className="group border border-border/80 bg-background/60 p-4 rounded-lg flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="inline-block text-[9px] uppercase tracking-wider text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-sm">
                              {sess.session_types?.focus}
                            </span>
                            <h3 className="font-display font-bold text-sm text-foreground mt-1.5 leading-tight">
                              {sess.session_types?.title}
                            </h3>
                          </div>

                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm border border-border bg-background/50 text-muted-foreground shrink-0">
                            {booking.payment_status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-2 border-t border-border/40">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-accent" />
                            {format(startDate, "HH:mm")} -{" "}
                            {format(new Date(sess.end_time), "HH:mm")} (
                            {sess.session_types?.duration_minutes}m)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-accent" />
                            {sess.location_name}
                          </span>
                        </div>

                        <button
                          onClick={() => handleManageClick(booking)}
                          className="w-full mt-2 inline-flex h-8 items-center justify-center rounded bg-background border border-border text-[10px] font-semibold uppercase tracking-wider hover:border-accent hover:text-accent transition-all cursor-pointer"
                        >
                          Manage Booking
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-border/40 pt-4 text-xs text-muted-foreground flex items-center gap-2 leading-relaxed">
              <Info className="h-4 w-4 text-accent shrink-0" />
              <span>
                Confirmed bookings show as dots on active days. Click "Manage Booking" to open the
                cancellation flow or details dialog.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Warning Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        {selectedBooking &&
          (() => {
            const sess = selectedBooking.scheduled_sessions;
            const hoursDiff = differenceInHours(new Date(sess.start_time), new Date());
            const isLate = hoursDiff < 12;

            return (
              <AlertDialogContent className="bg-surface border border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {isLate ? "Late Cancellation Warning" : "Cancel Booking"}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground text-sm space-y-3">
                    {isLate ? (
                      <>
                        <p className="font-semibold text-destructive">
                          This session is less than 12 hours away ({hoursDiff} hours remaining).
                        </p>
                        <p>
                          Under our 12-hour cancellation policy, this will be recorded as a{" "}
                          <span className="font-bold text-foreground">Late Cancellation</span>. Late
                          cancellations are counted as attended / non-refundable to respect the
                          coach's scheduled availability.
                        </p>
                      </>
                    ) : (
                      <p>
                        Are you sure you want to cancel your booking for "
                        {sess?.session_types?.title}" on{" "}
                        {format(new Date(sess?.start_time), "MMMM d")} at{" "}
                        {format(new Date(sess?.start_time), "HH:mm")}? This slot will be released to
                        waitlisted users.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border border-border text-foreground hover:bg-muted/10 cursor-pointer">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmCancel}
                    className="bg-destructive text-destructive-foreground hover:opacity-90 cursor-pointer"
                  >
                    Confirm Cancellation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            );
          })()}
      </AlertDialog>

      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        booking={selectedBooking}
        onCancelClick={() => {
          setIsDetailsModalOpen(false);
          setCancelDialogOpen(true);
        }}
      />
    </div>
  );
}
