import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  ShieldAlert,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/sessions/$sessionId")({
  component: AdminSessionDetailPage,
});

function AdminSessionDetailPage() {
  const { sessionId } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelReason, setCancelReason] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);

  // Fetch session details
  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-session-details", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(
          `
          *,
          session_types (
            title,
            description,
            focus,
            pricing,
            duration_minutes
          ),
          bookings (
            id,
            status,
            payment_status,
            client_id,
            profiles (
              full_name,
              email
            )
          ),
          waitlists (
            id,
            status,
            position,
            client_id,
            profiles (
              full_name,
              email
            )
          )
        `,
        )
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data as any;
    },
  });

  // Cancel session mutation
  const cancelSessionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .update({
          status: "cancelled",
          cancel_reason: cancelReason || "Cancelled by coach",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Session slot cancelled successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-session-details", sessionId] });
      setCancelOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to cancel session.");
    },
  });

  // Check in client mutation
  const checkInMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: "attended" | "no-show" | "confirmed";
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Client registration updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-session-details", sessionId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Action failed.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold font-display">Session Slot Not Found</h1>
        <Link to="/admin/dashboard" className="mt-4 text-accent hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const confirmedBookings = session.bookings?.filter((b: any) => b.status === "confirmed") || [];
  const activeBookings =
    session.bookings?.filter(
      (b: any) => b.status !== "cancelled" && b.status !== "late_cancelled",
    ) || [];
  const waitlist =
    session.waitlists
      ?.filter((w: any) => w.status === "waiting")
      .sort((a: any, b: any) => a.position - b.position) || [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        to="/admin/dashboard"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 text-accent" /> Back to Dashboard
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_2fr]">
        {/* Left Column: Session Info */}
        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                {session.session_types?.focus}
              </span>
              <h2 className="font-display text-xl font-bold text-foreground mt-3">
                {session.session_types?.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-1.5">
                {session.description || session.session_types?.description}
              </p>
            </div>

            <div className="border-t border-border/50 pt-4 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent shrink-0" />
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase">
                    Schedule
                  </span>
                  <span className="text-foreground">
                    {format(new Date(session.start_time), "EEEE, MMMM d, yyyy")}
                  </span>
                  <span className="block text-muted-foreground mt-0.5">
                    {format(new Date(session.start_time), "HH:mm")} -{" "}
                    {format(new Date(session.end_time), "HH:mm")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent shrink-0" />
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase">
                    Location
                  </span>
                  <span className="text-foreground">{session.location_name}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent shrink-0" />
                <div>
                  <span className="text-muted-foreground font-semibold block text-[10px] uppercase">
                    Pricing & Slots
                  </span>
                  <span className="text-foreground">
                    €{Number(session.pricing).toFixed(2)} · {session.max_slots} maximum client
                    capacity
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel Status Card */}
            {session.status === "cancelled" ? (
              <div className="rounded-sm border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                <AlertTriangle className="h-5 w-5 text-destructive mb-2" />
                <span className="font-semibold block uppercase tracking-wider text-[10px]">
                  Session Cancelled
                </span>
                <span className="text-muted-foreground mt-1 block">
                  Reason: {session.cancel_reason}
                </span>
              </div>
            ) : (
              <div className="pt-4 border-t border-border/50">
                {!cancelOpen ? (
                  <button
                    onClick={() => setCancelOpen(true)}
                    className="w-full h-9 flex items-center justify-center rounded-sm border border-destructive/30 text-destructive bg-destructive/5 text-xs font-semibold uppercase tracking-wider hover:bg-destructive/10 transition"
                  >
                    Cancel Session Slot
                  </button>
                ) : (
                  <div className="space-y-3 p-3 bg-background border border-border rounded-sm">
                    <span className="text-[10px] uppercase font-bold text-destructive block">
                      Provide cancel reason
                    </span>
                    <textarea
                      placeholder="E.g. Studio maintenance, holiday, scheduling error..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={2}
                      className="w-full px-2.5 py-1.5 text-xs rounded-sm border border-border bg-surface text-foreground focus:outline-none focus:border-accent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelSessionMutation.mutate()}
                        disabled={cancelSessionMutation.isPending}
                        className="flex-1 h-8 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-semibold uppercase tracking-wider rounded-sm hover:opacity-90 disabled:opacity-50"
                      >
                        Confirm Cancel
                      </button>
                      <button
                        onClick={() => setCancelOpen(false)}
                        className="h-8 border border-border px-3 text-[10px] uppercase font-semibold text-muted-foreground rounded-sm hover:text-foreground"
                      >
                        Abort
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Bookings and Waitlist lists */}
        <div className="space-y-8">
          {/* Registered Bookings */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" /> Registered Clients (
              {activeBookings.length}/{session.max_slots})
            </h3>

            {activeBookings.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No active client registrations for this slot.
              </p>
            ) : (
              <div className="space-y-3">
                {activeBookings.map((b: any) => {
                  let statusColor = "text-muted-foreground bg-muted/10 border-border";
                  if (b.status === "attended") {
                    statusColor = "text-accent bg-accent/10 border-accent/20";
                  } else if (b.status === "no-show") {
                    statusColor = "text-destructive bg-destructive/10 border-destructive/20";
                  }

                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-4 p-3 bg-background rounded-sm border border-border/50 text-xs"
                    >
                      <div>
                        <Link
                          to="/admin/clients/$clientId"
                          params={{ clientId: b.client_id }}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {b.profiles?.full_name || "N/A"}
                        </Link>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          {b.profiles?.email}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === "confirmed" ? (
                          <>
                            <button
                              onClick={() =>
                                checkInMutation.mutate({ bookingId: b.id, status: "attended" })
                              }
                              className="h-7 px-2.5 rounded-sm bg-accent/10 border border-accent/20 text-accent flex items-center gap-1 hover:bg-accent/20 text-[10px] font-semibold uppercase tracking-wider"
                            >
                              <Check className="h-3.5 w-3.5" /> Attended
                            </button>
                            <button
                              onClick={() =>
                                checkInMutation.mutate({ bookingId: b.id, status: "no-show" })
                              }
                              className="h-7 px-2.5 rounded-sm bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1 hover:bg-destructive/20 text-[10px] font-semibold uppercase tracking-wider"
                            >
                              <X className="h-3.5 w-3.5" /> No-Show
                            </button>
                          </>
                        ) : (
                          <>
                            <span
                              className={`inline-flex items-center rounded-sm px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border ${statusColor}`}
                            >
                              {b.status}
                            </span>
                            <button
                              onClick={() =>
                                checkInMutation.mutate({ bookingId: b.id, status: "confirmed" })
                              }
                              className="text-muted-foreground hover:text-foreground text-[10px] font-bold"
                              title="Reset to Confirmed"
                            >
                              Reset
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Waitlisted Clients */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" /> Active Waitlist ({waitlist.length})
            </h3>

            {waitlist.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No waitlisted clients for this slot.
              </p>
            ) : (
              <div className="space-y-3">
                {waitlist.map((wl: any, index: number) => (
                  <div
                    key={wl.id}
                    className="flex items-center justify-between gap-4 p-3 bg-background rounded-sm border border-border/50 text-xs"
                  >
                    <div>
                      <Link
                        to="/admin/clients/$clientId"
                        params={{ clientId: wl.client_id }}
                        className="font-semibold text-foreground hover:underline"
                      >
                        {wl.profiles?.full_name || "N/A"}
                      </Link>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        {wl.profiles?.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-sm uppercase tracking-wider">
                        Position #{wl.position}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
