import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Calendar, User, Clock, MapPin, Award, Loader2, ArrowRight } from "lucide-react";
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

  const completedCount = bookings?.filter((b) => b.status === "attended").length || 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, <span className="text-accent">{profile?.full_name || user?.email}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your personal training schedule, bookings, and progress.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        {/* Left column: Profile details */}
        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <User className="h-4 w-4" /> Profile Info
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                  Full Name
                </span>
                <span className="font-medium text-foreground">{profile?.full_name || "N/A"}</span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                  Email Address
                </span>
                <span className="font-medium text-foreground">{profile?.email}</span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                  Account Status
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent uppercase tracking-wider mt-1">
                  {profile?.status}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">
                  Assigned Role
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-foreground uppercase tracking-wider mt-1">
                  {profile?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Award className="h-4 w-4" /> Completed Workouts
            </h3>
            <p className="text-3xl font-display font-semibold text-foreground">{completedCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {completedCount > 0
                ? "Excellent progress! Keep booking and training hard."
                : "Sessions completed. Book a session to get started!"}
            </p>
          </div>
        </div>

        {/* Right column: Upcoming bookings & waitlist */}
        <div className="space-y-8">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Upcoming Bookings
              </h2>
              {upcomingBookings.length > 0 && (
                <Link
                  to="/client/bookings"
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {upcomingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border py-12 text-center rounded-sm">
                <Calendar className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-semibold text-foreground">No upcoming bookings</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs px-4">
                  You don't have any sessions scheduled for this week yet.
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Find a slot
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => {
                  const sess = booking.scheduled_sessions;
                  const startDate = new Date(sess.start_time);
                  return (
                    <div
                      key={booking.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <h3 className="font-display font-semibold text-base">
                          {sess.session_types?.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-accent" />
                            {format(startDate, "MMM d, yyyy 'at' HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-accent" />
                            {sess.location_name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-sm bg-background px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border border-border">
                          {booking.payment_status}
                        </span>
                        <Link
                          to="/client/bookings"
                          className="inline-flex h-7 items-center justify-center rounded-sm border border-border px-3 text-[10px] uppercase font-semibold tracking-wider hover:border-accent hover:text-accent"
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

          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Waitlist Status
            </h2>

            {!waitlists || waitlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border py-12 text-center rounded-sm">
                <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-semibold text-foreground">No waitlisted sessions</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs px-4">
                  When a session is full, you can join the waitlist.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {waitlists.map((wl) => {
                  const sess = wl.scheduled_sessions;
                  return (
                    <div
                      key={wl.id}
                      className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <h3 className="font-display font-semibold text-sm">
                          {sess.session_types?.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Starts {format(new Date(sess.start_time), "MMM d 'at' HH:mm")} ·{" "}
                          {sess.location_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                          Position #{wl.position}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
