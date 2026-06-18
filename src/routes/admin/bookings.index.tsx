import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, MoreHorizontal, Calendar as CalendarIcon, Filter, XCircle, RefreshCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/bookings/")({
  component: AdminBookingsList,
});

import { useQuery } from "@tanstack/react-query";
import { getAdminBookingsFn, getAdminSessionTypesFn } from "@/lib/api/admin.functions";
import { useState } from "react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { BookingDetailsModal } from "@/components/admin/BookingDetailsModal";
import { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

function AdminBookingsList() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sessionTypeFilter, setSessionTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => await getAdminBookingsFn(),
  });

  const { data: sessionTypes } = useQuery({
    queryKey: ["admin-session-types"],
    queryFn: async () => await getAdminSessionTypesFn(),
  });

  const displayBookings = (bookings || []).filter((booking: any) => {
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all client reservations and attendance history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker date={dateRange} setDate={setDateRange} />
            
            <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 h-10">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
                <SelectTrigger className="h-8 w-[150px] border-0 bg-transparent shadow-none focus:ring-0 p-0 text-sm truncate">
                  <SelectValue placeholder="Session Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessionTypes?.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>{type.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 h-10">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[130px] border-0 bg-transparent shadow-none focus:ring-0 p-0 text-sm">
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
          </div>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/admin/bookings/new">
              <Plus className="mr-2 h-4 w-4" />
              Log Booking
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[200px]">Date & Time</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading bookings...
                </TableCell>
              </TableRow>
            ) : displayBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              displayBookings.map((booking: any) => (
              <TableRow 
                key={booking.id} 
                className="border-border/50 hover:bg-muted/50 cursor-pointer"
                onClick={() => openModal(booking)}
              >
                <TableCell className="font-medium whitespace-nowrap">
                  {format(new Date(booking.scheduled_sessions?.start_time || booking.created_at), "MMM d, yyyy")}
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {format(new Date(booking.scheduled_sessions?.start_time || booking.created_at), "HH:mm")}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{booking.profiles?.full_name || booking.profiles?.email}</TableCell>
                <TableCell className="text-muted-foreground">{booking.scheduled_sessions?.session_types?.title || "Custom Session"}</TableCell>
                <TableCell className="text-muted-foreground truncate max-w-[150px]" title={booking.scheduled_sessions?.description || booking.scheduled_sessions?.session_types?.description}>
                  {booking.scheduled_sessions?.description || booking.scheduled_sessions?.session_types?.description || "-"}
                </TableCell>
                <TableCell className="font-medium">
                  {booking.scheduled_sessions?.session_types?.pricing 
                    ? `$${booking.scheduled_sessions.session_types.pricing}`
                    : "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      booking.status === "confirmed"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase text-[10px]"
                        : booking.status === "attended"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase text-[10px]"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20 uppercase text-[10px]"
                    }
                  >
                    {booking.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); openModal(booking); }}>
                    <span className="sr-only">View booking</span>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <BookingDetailsModal 
        booking={selectedBooking} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
