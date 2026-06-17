import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, MoreHorizontal, Calendar as CalendarIcon, Filter, XCircle, RefreshCcw } from "lucide-react";
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

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookingsList,
});

import { useQuery } from "@tanstack/react-query";
import { getAdminBookingsFn } from "@/lib/api/admin.functions";

function AdminBookingsList() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => await getAdminBookingsFn(),
  });

  const displayBookings = bookings || [];
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
          <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 h-10">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select defaultValue="all">
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading bookings...
                </TableCell>
              </TableRow>
            ) : displayBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              displayBookings.map((booking: any) => (
              <TableRow key={booking.id} className="border-border/50 hover:bg-muted/50">
                <TableCell className="font-medium whitespace-nowrap">
                  {format(new Date(booking.scheduled_sessions?.start_time || booking.created_at), "MMM d, yyyy")}
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {format(new Date(booking.scheduled_sessions?.start_time || booking.created_at), "HH:mm")}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{booking.profiles?.full_name || booking.profiles?.email}</TableCell>
                <TableCell className="text-muted-foreground">{booking.scheduled_sessions?.session_types?.title || "Custom Session"}</TableCell>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuItem className="cursor-pointer">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        View Session
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reschedule
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Booking
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
