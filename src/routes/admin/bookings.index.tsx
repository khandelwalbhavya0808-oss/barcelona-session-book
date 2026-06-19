import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Calendar as CalendarIcon, Filter, XCircle, RefreshCcw, Eye, CheckCircle, Clock, CreditCard, Users, Search } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getAdminBookingsFn, getAdminSessionTypesFn } from "@/lib/api/admin.functions";
import { useState } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { BookingDetailsModal } from "@/components/admin/BookingDetailsModal";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/admin/bookings/")({
  component: AdminBookingsList,
});

function AdminBookingsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => await getAdminBookingsFn(),
  });

  const { data: sessionTypes } = useQuery({
    queryKey: ["admin-session-types"],
    queryFn: async () => await getAdminSessionTypesFn(),
  });

  const totalCount = bookings?.length || 0;
  const attendedCount = bookings?.filter((b: any) => b.status === "attended").length || 0;
  const confirmedCount = bookings?.filter((b: any) => b.status === "confirmed").length || 0;
  const cancelledCount = bookings?.filter((b: any) => b.status === "cancelled" || b.status === "late_cancelled").length || 0;

  const displayBookings = (bookings || []).filter((booking: any) => {
    // Search Query (Client name/email, session title)
    if (searchQuery) {
      const clientName = booking.profiles?.full_name?.toLowerCase() || "";
      const clientEmail = booking.profiles?.email?.toLowerCase() || "";
      const sessionTitle = booking.scheduled_sessions?.session_types?.title?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      if (!clientName.includes(query) && !clientEmail.includes(query) && !sessionTitle.includes(query)) {
        return false;
      }
    }

    // Status Filter
    if (statusFilter !== "all" && booking.status !== statusFilter) return false;
    
    // Session Type Filter
    if (sessionTypeFilter !== "all") {
      const typeId = booking.scheduled_sessions?.session_types?.id;
      if (!typeId || typeId !== sessionTypeFilter) return false;
    }

    // Date Range Filter
    if (dateRange?.from) {
      const bookingDate = new Date(booking.scheduled_sessions?.start_time || booking.created_at);
      if (dateRange.to) {
        if (!isWithinInterval(bookingDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) })) {
          return false;
        }
      } else {
        if (!isWithinInterval(bookingDate, { start: startOfDay(dateRange.from), end: endOfDay(dateRange.from) })) {
          return false;
        }
      }
    }

    return true;
  });

  const openModal = (booking: any) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleResetFilters = () => {
    setStatusFilter("all");
    setSessionTypeFilter("all");
    setDateRange(undefined);
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Bookings Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer attendance, verify payments, and manage reservations.
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/15 cursor-pointer">
          <Link to="/admin/bookings/new">
            <Plus className="mr-2 h-4 w-4" />
            Log Booking
          </Link>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Bookings */}
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md shadow-sm group hover:border-accent/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Bookings</span>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">{totalCount}</span>
            <span className="text-xs text-muted-foreground">registered</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/0 via-accent/30 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Attended Bookings */}
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md shadow-sm group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attended</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">{attendedCount}</span>
            <span className="text-xs text-emerald-500 font-medium">
              {totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0}% attendance
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Confirmed Bookings */}
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md shadow-sm group hover:border-blue-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmed</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">{confirmedCount}</span>
            <span className="text-xs text-muted-foreground">pending session</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Cancelled Bookings */}
        <div className="relative overflow-hidden rounded-xl border border-border/40 bg-surface/50 p-5 backdrop-blur-md shadow-sm group hover:border-rose-500/30 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cancelled</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500">
              <XCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-display font-bold text-foreground">{cancelledCount}</span>
            <span className="text-xs text-rose-500 font-medium">
              {totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0}% cancel rate
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/0 via-rose-500/30 to-rose-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Advanced Glassmorphic Filters Bar */}
      <div className="rounded-xl border border-border/40 bg-surface/30 p-4 backdrop-blur-md shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search client or workout..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background/50 text-sm text-foreground focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          
          <div className="flex items-center gap-2 bg-background/50 border border-border rounded-lg px-3 h-10">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
              <SelectTrigger className="h-8 w-[140px] border-0 bg-transparent shadow-none focus:ring-0 p-0 text-sm truncate">
                <SelectValue placeholder="Workout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workouts</SelectItem>
                {sessionTypes?.map((type: any) => (
                  <SelectItem key={type.id} value={type.id}>{type.title}</SelectItem>
                ))}
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
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="attended">Attended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(statusFilter !== "all" || sessionTypeFilter !== "all" || dateRange || searchQuery) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleResetFilters}
              className="h-10 w-10 text-muted-foreground hover:text-foreground rounded-lg"
              title="Reset Filters"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bookings List Table */}
      <div className="rounded-xl border border-border/40 bg-surface/50 shadow-md overflow-hidden backdrop-blur-md">
        <Table>
          <TableHeader className="bg-background/20 border-b border-border/40">
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="py-4">Client</TableHead>
              <TableHead className="py-4">Workout Session</TableHead>
              <TableHead className="py-4">Date & Time</TableHead>
              <TableHead className="py-4">Payment</TableHead>
              <TableHead className="py-4">Status</TableHead>
              <TableHead className="py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <RefreshCcw className="h-6 w-6 animate-spin text-accent" />
                    <span>Loading bookings database...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <CalendarIcon className="h-10 w-10 text-muted-foreground/30" />
                    <span className="font-semibold text-foreground">No bookings matching filters</span>
                    <span className="text-xs">Adjust your search parameter or filters above.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayBookings.map((booking: any) => {
                const profile = booking.profiles;
                const session = booking.scheduled_sessions;
                const sessionType = session?.session_types;
                const bookingDate = new Date(session?.start_time || booking.created_at);

                return (
                  <TableRow 
                    key={booking.id} 
                    className="border-border/30 hover:bg-muted/30 cursor-pointer group transition-all duration-200 border-l-2 border-l-transparent hover:border-l-accent"
                    onClick={() => openModal(booking)}
                  >
                    {/* Client Cell */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border/40 shadow-sm transition-colors group-hover:border-accent/40">
                          {profile?.avatar_url ? (
                            <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} />
                          ) : null}
                          <AvatarFallback className="bg-muted text-[11px] font-bold text-foreground">
                            {getInitials(profile?.full_name, profile?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm group-hover:text-accent transition-colors">
                            {profile?.full_name || "Unknown Client"}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {profile?.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Session Cell */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col max-w-[220px]">
                        <span className="font-semibold text-foreground text-sm">
                          {sessionType?.title || "Custom Workout"}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold border-border/50">
                            {sessionType?.focus || "Strength"}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {session?.location_name || "Gym"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Date Cell */}
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                          {format(bookingDate, "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          {format(bookingDate, "HH:mm")} ({sessionType?.duration_minutes || 60}m)
                        </span>
                      </div>
                    </TableCell>

                    {/* Payment Cell */}
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <CreditCard className={`h-4 w-4 ${booking.payment_status === "paid" ? "text-emerald-500" : "text-amber-500/70"}`} />
                        <span className={`text-xs font-semibold ${booking.payment_status === "paid" ? "text-emerald-500" : "text-amber-500"}`}>
                          {booking.payment_status === "paid" ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status Cell */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 font-bold uppercase tracking-wider text-[9px] border shadow-sm ${
                          booking.status === "confirmed"
                            ? "bg-blue-500/5 border-blue-500/20 text-blue-400"
                            : booking.status === "attended"
                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          booking.status === "confirmed"
                            ? "bg-blue-500 animate-pulse"
                            : booking.status === "attended"
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                        }`} />
                        {booking.status}
                      </Badge>
                    </TableCell>

                    {/* Actions Cell */}
                    <TableCell className="py-3.5 text-right pr-6">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-accent rounded-lg"
                        onClick={(e) => { e.stopPropagation(); openModal(booking); }}
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal 
        booking={selectedBooking} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
