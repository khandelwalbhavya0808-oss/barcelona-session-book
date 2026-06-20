import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus,
  Eye,
  Edit2,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Filter,
  Search,
  RotateCcw,
  AlertCircle,
  Dumbbell,
  Percent,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/sessions/")({
  component: AdminSessionsList,
});

function AdminSessionsList() {
  const [focusFilter, setFocusFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["admin-scheduled-sessions"],
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
            status
          )
        `,
        )
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  // Calculate Metrics
  const totalCount = sessions?.length || 0;
  const activeCount = sessions?.filter((s: any) => s.status === "active").length || 0;
  const cancelledCount = sessions?.filter((s: any) => s.status === "cancelled").length || 0;

  let totalCapacity = 0;
  let totalBookings = 0;

  sessions?.forEach((session: any) => {
    if (session.status === "active") {
      totalCapacity += session.max_slots || 0;
      const confirmedBookings =
        session.bookings?.filter((b: any) => b.status === "confirmed" || b.status === "attended")
          .length || 0;
      totalBookings += confirmedBookings;
    }
  });

  const occupancyRate = totalCapacity > 0 ? Math.round((totalBookings / totalCapacity) * 100) : 0;

  const displaySessions = (sessions || []).filter((session: any) => {
    // Search Query
    if (searchQuery) {
      const title = session.session_types?.title?.toLowerCase() || "";
      const description =
        session.description?.toLowerCase() ||
        session.session_types?.description?.toLowerCase() ||
        "";
      const location = session.location_name?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      if (!title.includes(query) && !description.includes(query) && !location.includes(query)) {
        return false;
      }
    }
    // Focus Filter
    if (focusFilter !== "all" && session.session_types?.focus !== focusFilter) {
      return false;
    }
    // Status Filter
    if (statusFilter !== "all" && session.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setFocusFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Workout Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, update, and manage your scheduled personal training and group workout sessions.
          </p>
        </div>

        <Button
          asChild
          className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/15 cursor-pointer"
        >
          <Link to="/admin/sessions/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Link>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Sessions */}
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md shadow-sm group hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Sessions
            </span>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Dumbbell className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">{totalCount}</span>
            <span className="text-xs text-muted-foreground">scheduled</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Active Sessions */}
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md shadow-sm group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Slots
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">{activeCount}</span>
            <span className="text-xs text-muted-foreground">bookable</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Cancelled Sessions */}
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md shadow-sm group hover:border-rose-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cancelled
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">
              {cancelledCount}
            </span>
            <span className="text-xs text-muted-foreground">inactive</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/0 via-rose-500/30 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Occupancy Rate */}
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md shadow-sm group hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Occupancy
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Percent className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">
              {occupancyRate}%
            </span>
            <span className="text-xs text-muted-foreground">
              {totalBookings} / {totalCapacity} booked
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Advanced Glassmorphic Filters Bar */}
      <div className="rounded-xl border border-border/40 bg-surface/30 p-4 backdrop-blur-md shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search session title, description, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 h-10">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={focusFilter} onValueChange={setFocusFilter}>
              <SelectTrigger className="h-8 w-[120px] border-0 bg-transparent shadow-none focus:ring-0 p-0 text-sm">
                <SelectValue placeholder="Focus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Focuses</SelectItem>
                <SelectItem value="Strength">Strength</SelectItem>
                <SelectItem value="Conditioning">Conditioning</SelectItem>
                <SelectItem value="Mobility">Mobility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 h-10">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent shadow-none focus:ring-0 p-0 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(focusFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetFilters}
              className="h-10 w-10 text-muted-foreground hover:text-foreground rounded-lg"
              title="Reset Filters"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Sessions List Table */}
      <div className="rounded-xl border border-border/40 bg-surface/50 shadow-md overflow-hidden backdrop-blur-md">
        <Table>
          <TableHeader className="bg-background/20 border-b border-border/40">
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="py-4">Date & Time</TableHead>
              <TableHead className="py-4">Workout Session</TableHead>
              <TableHead className="py-4">Location</TableHead>
              <TableHead className="py-4">Pricing</TableHead>
              <TableHead className="py-4">Occupancy</TableHead>
              <TableHead className="py-4">Status</TableHead>
              <TableHead className="py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RotateCcw className="h-6 w-6 animate-spin text-accent" />
                    <span>Loading scheduled sessions database...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displaySessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground/30" />
                    <span className="font-semibold text-foreground">
                      No sessions matching filters
                    </span>
                    <span className="text-xs">Schedule a session or adjust filters above.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displaySessions.map((session: any) => {
                const confirmedCount =
                  session.bookings?.filter(
                    (b: any) => b.status === "confirmed" || b.status === "attended",
                  ).length || 0;

                const percent = Math.min(
                  Math.round((confirmedCount / session.max_slots) * 100),
                  100,
                );

                return (
                  <TableRow
                    key={session.id}
                    className="border-border/30 hover:bg-muted/30 group transition-all duration-200 border-l-2 border-l-transparent hover:border-l-accent animate-in fade-in"
                  >
                    {/* Date Cell */}
                    <TableCell className="py-4 font-medium whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-foreground font-semibold text-sm">
                          <CalendarIcon className="h-3.5 w-3.5 text-accent" />
                          {format(new Date(session.start_time), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 ml-5">
                          {format(new Date(session.start_time), "HH:mm")} (
                          {session.session_types?.duration_minutes || 60}m)
                        </span>
                      </div>
                    </TableCell>

                    {/* Session Cell */}
                    <TableCell className="py-4">
                      <div className="flex flex-col max-w-[240px]">
                        <span className="font-semibold text-foreground text-sm group-hover:text-accent transition-colors">
                          {session.session_types?.title}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">
                          {session.description ||
                            session.session_types?.description ||
                            "No class description provided."}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px] uppercase tracking-wider font-bold border-border/50 bg-background/30"
                          >
                            {session.session_types?.focus}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* Location Cell */}
                    <TableCell className="py-4 text-muted-foreground">
                      <div className="flex flex-col max-w-[150px]">
                        <span className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          {session.location_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-1 ml-5">
                          {session.session_types?.location_type === "Studio"
                            ? "Indoor Studio"
                            : "Outdoor Venue"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Price Cell */}
                    <TableCell className="py-4 font-semibold text-sm text-foreground">
                      €{Number(session.pricing).toFixed(2)}
                    </TableCell>

                    {/* Occupancy Progress Cell */}
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1 w-28">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                          <span>
                            {confirmedCount} / {session.max_slots} slots
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/20 shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              percent === 100
                                ? "bg-emerald-500"
                                : percent >= 75
                                  ? "bg-amber-500"
                                  : "bg-accent"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    {/* Status Cell */}
                    <TableCell className="py-4">
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px] border shadow-sm ${
                          session.status === "active"
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            session.status === "active"
                              ? "bg-emerald-500 animate-pulse"
                              : "bg-rose-500"
                          }`}
                        />
                        {session.status}
                      </Badge>
                    </TableCell>

                    {/* Actions Cell */}
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                          asChild
                          title="View Registrations"
                        >
                          <Link to="/admin/sessions/$sessionId" params={{ sessionId: session.id }}>
                            <Eye className="h-4.5 w-4.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-accent rounded-lg"
                          asChild
                          title="Edit Session"
                        >
                          <Link to={`/admin/sessions/edit/${session.id}`}>
                            <Edit2 className="h-4.5 w-4.5" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
