import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import {
  Users,
  Calendar,
  TrendingUp,
  Settings,
  Plus,
  UserCheck,
  Loader2,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();

  // Query 1: Total clients
  const { data: clientsCount, isLoading: clientsLoading } = useQuery({
    queryKey: ["admin-dashboard-clients-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("role", ["client", "user"]);

      if (error) throw error;
      return count || 0;
    },
  });

  // Query 2: Weekly Bookings
  const { data: weeklyBookings, isLoading: weeklyLoading } = useQuery({
    queryKey: ["admin-dashboard-weekly-bookings"],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("bookings")
        .select("id, status")
        .gte("created_at", oneWeekAgo.toISOString());

      if (error) throw error;
      return data || [];
    },
  });

  // Query 3: Today's Scheduled Sessions
  const { data: todaySessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-dashboard-today-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(
          `
          id,
          start_time,
          end_time,
          location_name,
          max_slots,
          session_types (
            title,
            focus,
            duration_minutes
          ),
          bookings (
            id,
            status,
            client_id,
            profiles (
              full_name,
              email
            )
          )
        `,
        )
        .gte("start_time", todayStart)
        .lte("start_time", todayEnd)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });

  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: "attended" | "no-show";
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
      toast.success("Client checked in successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-today-sessions"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Check-in failed.");
    },
  });

  const isLoading = authLoading || clientsLoading || weeklyLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Stats formatting
  const totalBookingsCount = weeklyBookings?.length || 0;
  const confirmedCount = weeklyBookings?.filter((b) => b.status === "confirmed").length || 0;
  const attendedCount = weeklyBookings?.filter((b) => b.status === "attended").length || 0;
  const noShowCount = weeklyBookings?.filter((b) => b.status === "no-show").length || 0;

  const completedRatio =
    totalBookingsCount > 0
      ? Math.round((attendedCount / (attendedCount + noShowCount || 1)) * 100)
      : 100;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage training slots, client accounts, waitlists, and view occupancy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/sessions/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-4 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create Template
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-4 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Settings className="h-4 w-4" /> System Settings
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3 mb-10">
        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Clients
            </span>
            <Users className="h-5 w-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-semibold text-foreground">{clientsCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Registered user profiles</p>
        </div>

        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Weekly Bookings
            </span>
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-semibold text-foreground">
            {totalBookingsCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {confirmedCount} active bookings pending
          </p>
        </div>

        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attendance Ratio
            </span>
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-semibold text-foreground">{completedRatio}%</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {attendedCount} attended, {noShowCount} no-show
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        {/* Left Column: Today's Schedule and Check-in */}
        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Today's Scheduled Sessions ({todaySessions?.length || 0})
          </h2>

          {!todaySessions || todaySessions.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border py-12 text-center text-sm text-muted-foreground bg-background/50">
              No sessions scheduled for today.
            </div>
          ) : (
            <div className="space-y-6">
              {todaySessions.map((session) => {
                const confirmed =
                  session.bookings?.filter((b: any) => b.status === "confirmed") || [];
                const attended =
                  session.bookings?.filter((b: any) => b.status === "attended") || [];
                const noShow = session.bookings?.filter((b: any) => b.status === "no-show") || [];
                const allBookings = session.bookings || [];

                return (
                  <div
                    key={session.id}
                    className="border-b border-border/50 pb-6 last:border-0 last:pb-0 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-semibold text-lg text-accent">
                            {format(new Date(session.start_time), "HH:mm")}
                          </span>
                          <h3 className="font-semibold text-sm">{session.session_types?.title}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {session.location_name} · Duration:{" "}
                          {session.session_types?.duration_minutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground bg-background px-2 py-0.5 border border-border rounded-sm">
                          {confirmed.length + attended.length}/{session.max_slots} Booked
                        </span>
                        <Link
                          to="/admin/sessions/$sessionId"
                          params={{ sessionId: session.id }}
                          className="inline-flex h-7 items-center justify-center rounded-sm border border-border px-3 text-[10px] uppercase font-semibold tracking-wider hover:border-accent hover:text-accent"
                        >
                          Details
                        </Link>
                      </div>
                    </div>

                    {/* Booked Client List for checking in */}
                    {allBookings.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-6">
                        No clients registered for this slot.
                      </p>
                    ) : (
                      <div className="pl-6 space-y-2">
                        <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground block">
                          Registered Clients
                        </span>
                        {allBookings.map((b: any) => (
                          <div
                            key={b.id}
                            className="flex items-center justify-between gap-4 p-2 bg-background/50 rounded-sm border border-border/40 text-xs"
                          >
                            <div>
                              <span className="font-medium text-foreground">
                                {b.profiles?.full_name || "N/A"}
                              </span>
                              <span className="text-muted-foreground block text-[10px]">
                                {b.profiles?.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {b.status === "confirmed" ? (
                                <>
                                  <button
                                    onClick={() =>
                                      checkInMutation.mutate({
                                        bookingId: b.id,
                                        status: "attended",
                                      })
                                    }
                                    className="h-6 w-6 rounded-sm bg-accent/20 border border-accent/30 text-accent flex items-center justify-center hover:bg-accent/30"
                                    title="Mark Attended"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      checkInMutation.mutate({ bookingId: b.id, status: "no-show" })
                                    }
                                    className="h-6 w-6 rounded-sm bg-destructive/20 border border-destructive/30 text-destructive flex items-center justify-center hover:bg-destructive/30"
                                    title="Mark No-Show"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <span
                                  className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                    b.status === "attended"
                                      ? "bg-accent/10 border-accent/20 text-accent"
                                      : "bg-destructive/10 border-destructive/20 text-destructive"
                                  }`}
                                >
                                  {b.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Admin details verification */}
        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Authorized Session
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium pb-2 border-b border-border">
                <UserCheck className="h-4 w-4 text-accent" />
                <span>Logged in as Admin</span>
              </div>
              <div className="pt-1">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Name
                </span>
                <span className="text-foreground font-semibold text-sm">
                  {profile?.full_name || "Alex Moreno"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Admin Email
                </span>
                <span className="text-foreground">{profile?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
