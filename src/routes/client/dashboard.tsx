import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import {
  Calendar,
  User,
  Clock,
  MapPin,
  Award,
  Loader2,
  ArrowRight,
  Wallet,
  Activity,
  BellRing,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/client/dashboard")({
  component: ClientDashboard,
});

function ClientDashboard() {
  const { user, profile, loading: authLoading } = useAuth();

  // Query: Fetch client bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["client-dashboard-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          payment_status,
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
        .eq("client_id", user?.id || "");

      if (error) throw error;
      return data as any[];
    },
  });

  // Query: Fetch client waitlists
  const { data: waitlists, isLoading: waitlistsLoading } = useQuery({
    queryKey: ["client-dashboard-waitlists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlists")
        .select(
          `
          id,
          position,
          status,
          scheduled_sessions (
            id,
            start_time,
            location_name,
            session_types (
              title
            )
          )
        `,
        )
        .eq("client_id", user?.id || "")
        .eq("status", "waiting");

      if (error) throw error;
      return data as any[];
    },
  });

  const isLoading = authLoading || bookingsLoading || waitlistsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Calculate stats
  const upcomingBookings =
    bookings?.filter(
      (b) => b.status === "confirmed" && new Date(b.scheduled_sessions?.start_time) >= new Date(),
    ) || [];

  const completedSessions = bookings?.filter((b) => b.status === "attended") || [];
  const completedCount = completedSessions.length;

  const totalPaid = completedSessions
    .filter((b) => b.payment_status === "paid")
    .reduce((acc, b) => {
      const price = Number(b.scheduled_sessions?.session_types?.pricing || 0);
      return acc + price;
    }, 0);

  const pastBookings = bookings?.filter((b) => b.status !== "confirmed") || [];

  // Determine next session
  const nextSession = upcomingBookings.length > 0
    ? upcomingBookings.reduce((earliest, current) => {
        const earliestTime = new Date(earliest.scheduled_sessions.start_time).getTime();
        const currentTime = new Date(current.scheduled_sessions.start_time).getTime();
        return earliestTime < currentTime ? earliest : current;
      })
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-10 animate-in fade-in duration-500">
      
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-surface to-background p-8 md:p-10 shadow-lg">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 -mb-10 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider mb-4 border border-accent/20">
              <Sparkles className="h-3 w-3" /> Client Dashboard
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, <span className="text-accent">{profile?.full_name || user?.email}</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Track your training progress, view upcoming sessions, and review your payment logs. Let's make every session count.
            </p>
            <div className="mt-5">
              <Link
                to="/client/book"
                className="inline-flex h-9 items-center justify-center rounded-md bg-accent px-5 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 shadow-md"
              >
                Book a Session
              </Link>
            </div>
          </div>
          
          {nextSession && (
            <div className="flex flex-col bg-background/60 backdrop-blur-sm border border-border/40 p-5 rounded-lg max-w-xs w-full">
              <span className="text-[10px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3" /> Next Session
              </span>
              <h3 className="font-display font-bold text-base text-foreground mt-1.5">
                {nextSession.scheduled_sessions.session_types?.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(nextSession.scheduled_sessions.start_time), "MMM d, yyyy 'at' HH:mm")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                📍 {nextSession.scheduled_sessions.location_name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Stats Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Completed Workouts */}
        <div className="group rounded-xl border border-border bg-surface p-6 shadow-sm hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Award className="h-5 w-5 text-accent" /> Completed Workouts
            </h3>
            <span className="h-8 w-8 rounded-lg bg-accent/5 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
              <Activity className="h-4 w-4 text-accent" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-display font-extrabold text-foreground">{completedCount}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {completedCount > 0
                ? "Excellent progress! Keep booking and training hard."
                : "No sessions completed yet. Book a session to get started!"}
            </p>
          </div>
        </div>

        {/* Payments Made (In Person) */}
        <div className="group rounded-xl border border-border bg-surface p-6 shadow-sm hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Wallet className="h-5 w-5 text-accent" /> In-Person Payments
            </h3>
            <span className="h-8 w-8 rounded-lg bg-accent/5 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
              <span className="text-sm font-bold text-accent">€</span>
            </span>
          </div>
          <div className="mt-4">
            <p className="text-4xl font-display font-extrabold text-foreground">
              €{totalPaid.toFixed(2)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Total payment made on-premises (in person) for completed sessions.
            </p>
          </div>
        </div>

        {/* Account Details Quick Card */}
        <div className="group rounded-xl border border-border bg-surface p-6 shadow-sm hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-accent" /> Profile Info
            </h3>
            <span className="h-8 w-8 rounded-lg bg-accent/5 flex items-center justify-center group-hover:bg-accent/15 transition-colors">
              <User className="h-4 w-4 text-accent" />
            </span>
          </div>
          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Role</span>
              <span className="font-semibold text-foreground uppercase tracking-wider bg-background border border-border px-2 py-0.5 rounded-sm">
                {profile?.role}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-accent uppercase tracking-wider bg-accent/10 px-2 py-0.5 rounded-sm">
                {profile?.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap max-w-[120px]">{profile?.email}</span>
              <Link to="/profile" className="text-accent hover:underline font-semibold flex items-center gap-0.5">
                Edit
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Bookings & Waitlist / Alerts */}
      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        
        {/* Upcoming Bookings card */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" /> Upcoming Bookings
            </h2>
            {upcomingBookings.length > 0 && (
              <Link
                to="/client/bookings"
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 group"
              >
                Manage All <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border py-12 text-center rounded-xl bg-background/30">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">No upcoming bookings</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs px-4">
                You don't have any training sessions scheduled right now.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex h-9 items-center rounded-md bg-accent px-5 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 shadow-sm"
              >
                Book a Session
              </Link>
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-border/40">
              {upcomingBookings.map((booking, index) => {
                const sess = booking.scheduled_sessions;
                const startDate = new Date(sess.start_time);
                return (
                  <div
                    key={booking.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${index > 0 ? "pt-4" : ""}`}
                  >
                    <div>
                      <h3 className="font-display font-semibold text-base text-foreground">
                        {sess.session_types?.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-background border border-border/50 px-2 py-1 rounded-md">
                          <Calendar className="h-3.5 w-3.5 text-accent" />
                          {format(startDate, "MMM d, yyyy 'at' HH:mm")}
                        </span>
                        <span className="flex items-center gap-1.5 bg-background border border-border/50 px-2 py-1 rounded-md">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          {sess.location_name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-sm bg-background/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border">
                        {booking.payment_status}
                      </span>
                      <Link
                        to="/client/bookings"
                        className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-4 text-xs uppercase font-semibold tracking-wider hover:border-accent hover:text-accent transition-colors"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Waitlist & Trainer Alerts */}
        <div className="space-y-6">
          {/* Trainer Announcements/Notifications */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-4">
              <BellRing className="h-5 w-5 text-accent" /> Alerts & Notices
            </h2>
            <div className="space-y-4">
              <div className="text-xs border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <span className="font-semibold text-accent block mb-1">📍 Outdoor Training Locations</span>
                <p className="text-muted-foreground leading-relaxed">
                  Sessions scheduled for beach/park are running as planned. If rain occurs, check your email for alternate indoor studio assignments.
                </p>
              </div>
              <div className="text-xs border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <span className="font-semibold text-accent block mb-1">⏰ Cancellation Policy</span>
                <p className="text-muted-foreground leading-relaxed">
                  Please cancel or reschedule at least 12 hours in advance. Late cancellations count as attended.
                </p>
              </div>
            </div>
          </div>

          {/* Waitlist Status */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" /> Waitlist Status
            </h2>

            {!waitlists || waitlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border py-8 text-center rounded-xl bg-background/20">
                <Clock className="h-7 w-7 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-semibold text-foreground">No waitlisted sessions</p>
                <p className="mt-1 text-[11px] text-muted-foreground px-4">
                  When a session is full, you can join the queue.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {waitlists.map((wl) => {
                  const sess = wl.scheduled_sessions;
                  return (
                    <div
                      key={wl.id}
                      className="flex items-center justify-between border-b border-border/30 pb-3.5 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0 pr-2">
                        <h3 className="font-display font-semibold text-sm text-foreground truncate">
                          {sess.session_types?.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">
                          {format(new Date(sess.start_time), "MMM d 'at' HH:mm")}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-md uppercase tracking-wider shrink-0 border border-accent/10">
                        Pos #{wl.position}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Past Sessions History Section */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-accent" /> Past Sessions History
        </h2>

        {pastBookings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground bg-background/20">
            No booking history found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                <tr>
                  <th className="p-4 rounded-tl-lg">Session Type</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Location</th>
                  <th className="p-4 text-right">In-Person Pricing</th>
                  <th className="p-4 text-center rounded-tr-lg">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {pastBookings.map((booking) => {
                  const sess = booking.scheduled_sessions;
                  const startDate = new Date(sess.start_time);

                  let statusBadge = "";
                  if (booking.status === "attended") {
                    statusBadge = "text-accent bg-accent/10 border-accent/20";
                  } else if (booking.status === "no-show") {
                    statusBadge = "text-destructive bg-destructive/10 border-destructive/20";
                  } else {
                    statusBadge = "text-muted-foreground bg-muted/10 border-border";
                  }

                  const paymentBadge = booking.payment_status === "paid"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-amber-400 bg-amber-500/10 border-amber-500/20";

                  return (
                    <tr key={booking.id} className="hover:bg-background/20 transition-colors">
                      <td className="p-4 font-semibold text-foreground">
                        {sess.session_types?.title}
                        <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                          {sess.session_types?.focus || "General Fitness"}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">
                        {format(startDate, "MMM d, yyyy")}
                        <span className="block text-[10px] text-muted-foreground/75 font-normal mt-0.5">
                          {format(startDate, "HH:mm")}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground font-medium">{sess.location_name}</td>
                      <td className="p-4 text-foreground font-semibold text-right">
                        €{Number(sess.session_types?.pricing || 0).toFixed(2)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`inline-flex items-center rounded px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border ${statusBadge}`}>
                            {booking.status.replace("-", " ")}
                          </span>
                          <span className={`inline-flex items-center rounded px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border ${paymentBadge}`}>
                            {booking.payment_status === "paid" ? "Paid In-Person" : "Unpaid"}
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
  );
}

