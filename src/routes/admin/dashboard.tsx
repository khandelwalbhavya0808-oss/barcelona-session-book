import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminDashboardStatsFn, updateBookingStatusFn } from "@/lib/api/admin.functions";
import {
  Users,
  Calendar as CalendarIcon,
  TrendingUp,
  Settings,
  Plus,
  UserCheck,
  Loader2,
  Check,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      return await getAdminDashboardStatsFn();
    },
  });

  const clientsCount = dashboardData?.clientsCount || 0;
  const weeklyBookings = dashboardData?.weeklyBookings || [];
  const todaySessions = dashboardData?.todaySessions || [];

  // Check in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: "attended" | "no-show";
    }) => {
      return await updateBookingStatusFn({ data: { bookingId, status } });
    },
    onSuccess: () => {
      toast.success("Client checked in successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Check-in failed.");
    },
  });

  const isLoading = authLoading || dashboardLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
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
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor your business performance and daily schedule.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 h-10">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select defaultValue="7d">
              <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent shadow-none focus:ring-0 p-0 text-sm">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-semibold">{clientsCount}</div>
            <div className="flex items-center mt-1 text-xs text-emerald-500 font-medium">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +12% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Period Bookings</CardTitle>
            <CalendarIcon className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-semibold">{totalBookingsCount}</div>
            <div className="flex items-center mt-1 text-xs text-emerald-500 font-medium">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +8% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Attendance Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-semibold">{completedRatio}%</div>
            <div className="flex items-center mt-1 text-xs text-rose-500 font-medium">
              <ArrowDownRight className="mr-1 h-3 w-3" />
              -2% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contextual Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Button variant="outline" className="h-auto flex flex-col items-center justify-center gap-2 py-6 border-dashed hover:border-accent hover:bg-accent/5 transition-colors" asChild>
          <Link to="/admin/sessions/new">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-accent" />
            </div>
            <span className="font-semibold uppercase tracking-wider text-xs">Create Template</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex flex-col items-center justify-center gap-2 py-6 border-dashed hover:border-accent hover:bg-accent/5 transition-colors" asChild>
          <Link to="/admin/clients/new">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <span className="font-semibold uppercase tracking-wider text-xs">Add Client</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex flex-col items-center justify-center gap-2 py-6 border-dashed hover:border-accent hover:bg-accent/5 transition-colors" asChild>
          <Link to="/admin/bookings/new">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-accent" />
            </div>
            <span className="font-semibold uppercase tracking-wider text-xs">Log Booking</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex flex-col items-center justify-center gap-2 py-6 border-dashed hover:border-accent hover:bg-accent/5 transition-colors" asChild>
          <Link to="/admin/settings">
            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Settings className="h-5 w-5 text-accent" />
            </div>
            <span className="font-semibold uppercase tracking-wider text-xs">System Settings</span>
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        {/* Left Column: Today's Schedule and Check-in */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Today's Scheduled Sessions ({todaySessions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                            {confirmed.length + attended.length}/{session.max_slots} Booked
                          </span>
                          <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-semibold tracking-wider px-3" asChild>
                            <Link to={`/admin/sessions/${session.id}`}>Details</Link>
                          </Button>
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
                              className="flex items-center justify-between gap-4 p-2 bg-muted/30 rounded-sm border border-border/40 text-xs hover:bg-muted/50 transition-colors"
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
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-6 w-6 rounded-sm bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-600"
                                      onClick={() =>
                                        checkInMutation.mutate({
                                          bookingId: b.id,
                                          status: "attended",
                                        })
                                      }
                                      title="Mark Attended"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-6 w-6 rounded-sm bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20 hover:text-rose-600"
                                      onClick={() =>
                                        checkInMutation.mutate({ bookingId: b.id, status: "no-show" })
                                      }
                                      title="Mark No-Show"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </Button>
                                  </>
                                ) : (
                                  <span
                                    className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                      b.status === "attended"
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                        : "bg-rose-500/10 border-rose-500/20 text-rose-500"
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
          </CardContent>
        </Card>

        {/* Right Column: Admin details verification */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Authorized Session
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
