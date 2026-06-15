import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { ArrowLeft, User, Calendar, Shield, Clock, MapPin, Globe, Loader2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/clients/$clientId")({
  component: AdminClientDetailPage,
});

function AdminClientDetailPage() {
  const { clientId } = Route.useParams();

  // Query 1: Client profile info
  const {
    data: client,
    isLoading: clientLoading,
    error: clientError,
  } = useQuery({
    queryKey: ["admin-client-profile", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      return data as any;
    },
  });

  // Query 2: Booking history
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-client-bookings", clientId],
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
              focus,
              pricing
            )
          )
        `,
        )
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  // Query 3: Login history
  const { data: logins, isLoading: loginsLoading } = useQuery({
    queryKey: ["admin-client-logins", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_login_history")
        .select("*")
        .eq("user_id", clientId)
        .order("login_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as any[];
    },
  });

  const isLoading = clientLoading || bookingsLoading || loginsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Shield className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold font-display">Client Profile Not Found</h1>
        <Link
          to="/admin/clients"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to clients list
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        to="/admin/clients"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 text-accent" /> Back to Clients List
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_2.5fr]">
        {/* Left Column: Profile Card */}
        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-sm border border-border overflow-hidden bg-background flex items-center justify-center mb-4">
              {client.avatar_url ? (
                <img src={client.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>

            <h2 className="font-display text-xl font-semibold text-foreground">
              {client.full_name || "N/A"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">{client.email}</p>

            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              <span className="inline-flex items-center rounded-sm border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Role: {client.role}
              </span>
              <span
                className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                  client.status === "active"
                    ? "bg-accent/10 border-accent/20 text-accent"
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}
              >
                {client.status}
              </span>
            </div>

            <div className="w-full border-t border-border/50 mt-6 pt-4 text-left text-xs text-muted-foreground space-y-2.5">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold">
                  Client ID
                </span>
                <span className="text-foreground select-all font-mono text-[10px]">
                  {client.id}
                </span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-bold">
                  Joined Date
                </span>
                <span className="text-foreground">
                  {format(new Date(client.created_at), "MMMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: History and Auditing */}
        <div className="space-y-8">
          {/* Booking History */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" /> Booking History ({bookings?.length || 0})
            </h3>

            {!bookings || bookings.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No bookings on record for this client.
              </p>
            ) : (
              <div className="overflow-hidden border border-border/50 rounded-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Session</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Pricing</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {bookings.map((booking) => {
                      const sess = booking.scheduled_sessions;
                      const startDate = new Date(sess.start_time);
                      let statusColor = "text-muted-foreground bg-muted/10 border-border";

                      if (booking.status === "attended") {
                        statusColor = "text-accent bg-accent/10 border-accent/20";
                      } else if (
                        booking.status === "no-show" ||
                        booking.status === "late_cancelled"
                      ) {
                        statusColor = "text-destructive bg-destructive/10 border-destructive/20";
                      }

                      return (
                        <tr key={booking.id} className="hover:bg-surface/30">
                          <td className="p-3 font-semibold text-foreground">
                            {sess.session_types?.title}
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {sess.session_types?.focus}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {format(startDate, "MMM d, yyyy")}
                            <span className="block text-[10px]">{format(startDate, "HH:mm")}</span>
                          </td>
                          <td className="p-3 text-foreground font-medium">
                            €{Number(sess.session_types?.pricing).toFixed(2)}
                          </td>
                          <td className="p-3 text-muted-foreground uppercase tracking-wider text-[10px]">
                            {booking.payment_status}
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center rounded-sm px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border ${statusColor}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Login Audit Trail */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" /> Login Audit Log (Last 20)
            </h3>

            {!logins || logins.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                No authentication history logged.
              </p>
            ) : (
              <div className="overflow-hidden border border-border/50 rounded-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="p-3">Login Date</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">User Agent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-[11px] text-muted-foreground">
                    {logins.map((login) => (
                      <tr key={login.id} className="hover:bg-surface/30">
                        <td className="p-3 text-foreground">
                          {format(new Date(login.login_at), "yyyy-MM-dd HH:mm:ss")}
                        </td>
                        <td className="p-3 font-mono">{login.ip_address}</td>
                        <td className="p-3 truncate max-w-[250px]" title={login.user_agent}>
                          {login.user_agent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
