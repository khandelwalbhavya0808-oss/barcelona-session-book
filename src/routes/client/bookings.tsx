import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import {
  Calendar,
  MapPin,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { format, differenceInHours } from "date-fns";
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
              pricing
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          My Bookings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View your confirmed slots and training history.
        </p>
      </div>

      <div className="space-y-12">
        {/* Section: Active Bookings */}
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-accent" /> Active Bookings ({activeBookings.length})
          </h2>

          {activeBookings.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border py-12 text-center text-sm text-muted-foreground bg-surface/25">
              No active bookings scheduled.
              <div className="mt-4">
                <Link
                  to="/"
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
                const hoursDiff = differenceInHours(startDate, new Date());
                const isNearCancel = hoursDiff < 12;

                return (
                  <div
                    key={booking.id}
                    className="rounded-sm border border-border bg-surface p-6 shadow-sm flex flex-col justify-between space-y-4"
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
                          <Calendar className="h-4 w-4 text-accent shrink-0" />
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

                    <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-foreground">
                        €{Number(sess.session_types?.pricing).toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setIsDetailsModalOpen(true);
                        }}
                        className={`h-8 px-4 rounded-md text-[10px] uppercase font-semibold tracking-wider transition bg-surface border border-border hover:border-accent/40 hover:bg-accent/10 text-foreground`}
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
            <XCircle className="h-4 w-4 text-muted-foreground" /> Booking History (
            {pastBookings.length})
          </h2>

          {pastBookings.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border py-8 text-center text-sm text-muted-foreground bg-surface/10">
              No booking history.
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-surface overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="p-4">Session</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Status</th>
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
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
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
                          <span
                            className={`inline-flex items-center rounded-sm px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border ${statusColor}`}
                          >
                            {booking.status.replace("_", " ")}
                          </span>
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
                        {sess.session_types?.title}" on{" "}
                        {format(new Date(sess.start_time), "MMMM d")} at{" "}
                        {format(new Date(sess.start_time), "HH:mm")}? This slot will be released to
                        waitlisted users.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border border-border text-foreground hover:bg-muted/10">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleConfirmCancel}
                    className="bg-destructive text-destructive-foreground hover:opacity-90"
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
