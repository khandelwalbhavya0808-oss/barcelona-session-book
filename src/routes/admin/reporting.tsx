import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2, Download, BarChart3, TrendingUp, DollarSign, Percent } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/reporting")({
  component: AdminReportingPage,
});

function AdminReportingPage() {
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-reporting-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select(`
          id,
          status,
          payment_status,
          created_at,
          scheduled_sessions (
            pricing,
            location_name,
            start_time,
            session_types (
              title
            )
          ),
          profiles (
            full_name,
            email
          )
        `);

      if (error) throw error;
      return data as any[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !bookings) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-destructive">
        Failed to load reporting database. Please try refreshing.
      </div>
    );
  }

  // 1. Calculations: Revenue Metrics
  let earnedRevenue = 0;
  let pendingRevenue = 0;
  let attendanceAttended = 0;
  let attendanceNoShow = 0;
  let attendanceLateCancelled = 0;
  const locationCounts: Record<string, number> = {};

  bookings.forEach((b) => {
    const pricing = Number(b.scheduled_sessions?.pricing || 0);

    // Revenue calculations: count completed or late cancelled slots.
    if (b.status === "attended" || b.status === "late_cancelled" || b.status === "confirmed") {
      if (b.payment_status === "paid") {
        earnedRevenue += pricing;
      } else {
        pendingRevenue += pricing;
      }
    }

    // Attendance rates
    if (b.status === "attended") attendanceAttended++;
    else if (b.status === "no-show") attendanceNoShow++;
    else if (b.status === "late_cancelled") attendanceLateCancelled++;

    // Location popularity
    const loc = b.scheduled_sessions?.location_name || "Unknown";
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });

  const totalAttendanceAudited = attendanceAttended + attendanceNoShow + attendanceLateCancelled;
  const attendanceRate =
    totalAttendanceAudited > 0
      ? Math.round((attendanceAttended / totalAttendanceAudited) * 100)
      : 100;

  // Recharts Chart Data
  const attendanceChartData = [
    { name: "Attended", value: attendanceAttended, color: "oklch(0.71 0.19 45)" }, // orange accent
    { name: "No Show", value: attendanceNoShow, color: "oklch(0.6 0.22 25)" }, // red destructive
    { name: "Late Cancel", value: attendanceLateCancelled, color: "oklch(0.4 0.05 270)" }, // muted
  ].filter((item) => item.value > 0);

  const locationChartData = Object.keys(locationCounts).map((key) => ({
    name: key,
    bookings: locationCounts[key],
  }));

  // CSV Export Function
  const exportToCSV = () => {
    const headers = [
      "Booking ID",
      "Client Name",
      "Client Email",
      "Session Title",
      "Date & Time",
      "Location",
      "Price",
      "Payment Status",
      "Booking Status",
    ];
    const rows = bookings.map((b) => [
      b.id,
      b.profiles?.full_name || "N/A",
      b.profiles?.email || "N/A",
      b.scheduled_sessions?.session_types?.title || "N/A",
      b.scheduled_sessions?.start_time
        ? format(new Date(b.scheduled_sessions.start_time), "yyyy-MM-dd HH:mm")
        : "N/A",
      b.scheduled_sessions?.location_name || "N/A",
      Number(b.scheduled_sessions?.pricing || 0).toFixed(2),
      b.payment_status,
      b.status,
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map((val) => `"${val}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Alex_Moreno_Bookings_Report_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Business Reporting
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aggregate attendance rates, project monthly revenues, and export full reports.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-4 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Export CSV Report
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-sm bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Earned Revenue
            </span>
            <p className="text-2xl font-display font-semibold text-foreground">
              €{earnedRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-sm bg-muted/20 border border-border flex items-center justify-center text-muted-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Pending Revenue
            </span>
            <p className="text-2xl font-display font-semibold text-foreground">
              €{pendingRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-sm bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Audited Attendance Rate
            </span>
            <p className="text-2xl font-display font-semibold text-foreground">{attendanceRate}%</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Chart 1: Attendance Breakdown */}
        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" /> Attendance Breakdown
          </h3>

          {attendanceChartData.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No attendance logs logged yet.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-64">
              <div className="w-full h-48 sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "oklch(0.205 0.006 270)",
                        borderColor: "oklch(1 0 0 / 8%)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5 text-xs">
                {attendanceChartData.map((d, index) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground font-medium">
                      {d.name}: {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Popularity by Location */}
        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-6">
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-accent" /> Bookings by Location
          </h3>

          {locationChartData.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No booking logs registered yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationChartData}>
                  <XAxis dataKey="name" stroke="oklch(0.72 0.01 270)" fontSize={10} />
                  <YAxis stroke="oklch(0.72 0.01 270)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(0.205 0.006 270)",
                      borderColor: "oklch(1 0 0 / 8%)",
                    }}
                  />
                  <Bar dataKey="bookings" fill="oklch(0.71 0.19 45)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
