import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import {
  Calendar,
  User,
  Search,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/bookings")({
  component: AdminBookingsPage,
});

function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  // Fetch bookings
  const {
    data: bookings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-bookings-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          payment_status,
          created_at,
          scheduled_sessions (
            id,
            start_time,
            end_time,
            location_name,
            session_types (
              title,
              pricing
            )
          ),
          profiles (
            id,
            full_name,
            email,
            avatar_url
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  // Toggle payment status mutation
  const togglePaymentMutation = useMutation({
    mutationFn: async ({
      bookingId,
      paymentStatus,
    }: {
      bookingId: string;
      paymentStatus: "pending" | "paid";
    }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ payment_status: paymentStatus })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Payment status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update payment status.");
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { data, error } = await supabase
        .from("bookings")
        .update({ status: status })
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Booking status updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update booking status.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-destructive">
        Failed to load bookings database. Please try refreshing.
      </div>
    );
  }

  // Filter logic
  const filteredBookings = bookings?.filter((b) => {
    const profile = b.profiles || {};
    const nameMatch = (profile.full_name || "").toLowerCase().includes(search.toLowerCase());
    const emailMatch = (profile.email || "").toLowerCase().includes(search.toLowerCase());
    const searchMatch = nameMatch || emailMatch || search === "";

    const statusMatch = statusFilter === "all" || b.status === statusFilter;
    const paymentMatch = paymentFilter === "all" || b.payment_status === paymentFilter;

    return searchMatch && statusMatch && paymentMatch;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Booking Registry
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Audit personal training sessions registrations, mark attendance, and track on-premises
            payments.
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6 bg-surface p-4 rounded-sm border border-border">
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Search Client
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-xs bg-background rounded-sm border border-border text-foreground focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Filter Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 w-full text-xs bg-background rounded-sm border border-border text-foreground focus:outline-none focus:border-accent"
          >
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="attended">Attended</option>
            <option value="no-show">No Show</option>
            <option value="cancelled">Cancelled</option>
            <option value="late_cancelled">Late Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
            Filter Payment
          </label>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 w-full text-xs bg-background rounded-sm border border-border text-foreground focus:outline-none focus:border-accent"
          >
            <option value="all">All Payments</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* List Table */}
      <div className="rounded-sm border border-border bg-surface overflow-hidden shadow-sm">
        {filteredBookings?.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No bookings found matching filters.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="p-4">Client</th>
                <th className="p-4">Session Slot</th>
                <th className="p-4">Price</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredBookings?.map((booking) => {
                const sess = booking.scheduled_sessions || {};
                const profile = booking.profiles || {};
                const startDate = sess.start_time ? new Date(sess.start_time) : null;

                let statusColor = "text-muted-foreground bg-muted/10 border-border";
                if (booking.status === "attended") {
                  statusColor = "text-accent bg-accent/10 border-accent/20";
                } else if (booking.status === "no-show" || booking.status === "late_cancelled") {
                  statusColor = "text-destructive bg-destructive/10 border-destructive/20";
                }

                return (
                  <tr key={booking.id} className="hover:bg-surface/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-sm bg-background border border-border overflow-hidden flex items-center justify-center shrink-0">
                          {profile.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt="Avatar"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Link
                            to="/admin/clients/$clientId"
                            params={{ clientId: profile.id || "" }}
                            className="font-semibold text-foreground hover:underline"
                          >
                            {profile.full_name || "N/A"}
                          </Link>
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            {profile.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-foreground">
                        {sess.session_types?.title}
                      </span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        {startDate ? format(startDate, "MMM d, yyyy 'at' HH:mm") : "N/A"} ·{" "}
                        {sess.location_name}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      €{Number(sess.session_types?.pricing || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          togglePaymentMutation.mutate({
                            bookingId: booking.id,
                            paymentStatus: booking.payment_status === "paid" ? "pending" : "paid",
                          })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border hover:opacity-80 transition-opacity ${
                          booking.payment_status === "paid"
                            ? "bg-accent/10 border-accent/20 text-accent"
                            : "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}
                      >
                        {booking.payment_status}
                      </button>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded-sm px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border ${statusColor}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={booking.status}
                        onChange={(e) =>
                          updateStatusMutation.mutate({
                            bookingId: booking.id,
                            status: e.target.value,
                          })
                        }
                        className="px-2 py-1 text-[10px] uppercase font-bold bg-background rounded-sm border border-border text-muted-foreground focus:outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="attended">Attended</option>
                        <option value="no-show">No Show</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="late_cancelled">Late Cancelled</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
