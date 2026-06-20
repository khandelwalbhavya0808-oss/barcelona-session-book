import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  createBookingFn,
  getAdminClientsFn,
  getAdminUpcomingSessionsFn,
} from "@/lib/api/admin.functions";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/bookings/new")({
  component: AdminBookingsNewPage,
});

function AdminBookingsNewPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [status, setStatus] = useState<"confirmed" | "attended" | "cancelled">("confirmed");

  // Fetch clients
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => await getAdminClientsFn(),
  });

  const { data: upcomingSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-upcoming-sessions"],
    queryFn: async () => await getAdminUpcomingSessionsFn(),
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      return await createBookingFn({
        data: {
          clientId,
          sessionId,
          status,
        },
      });
    },
    onSuccess: () => {
      toast.success("Booking logged successfully!");
      router.navigate({ to: "/admin/bookings" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log booking.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !sessionId) {
      toast.error("Please select a client and a session.");
      return;
    }
    createBookingMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        to="/admin/bookings"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 text-accent" /> Back to Bookings
      </Link>

      <div className="rounded-sm border border-border bg-surface p-8 shadow-lg space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Log Booking
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manually register a client for a session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Client *
              </label>
              {clientsLoading ? (
                <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading clients...
                </div>
              ) : (
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>
                    -- Choose a Client --
                  </option>
                  {clients?.map((client: any) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name || client.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Session *
              </label>
              {sessionsLoading ? (
                <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading sessions...
                </div>
              ) : (
                <select
                  required
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>
                    -- Choose a Session --
                  </option>
                  {upcomingSessions?.map((session: any) => (
                    <option key={session.id} value={session.id}>
                      {format(new Date(session.start_time), "MMM d, HH:mm")} -{" "}
                      {session.session_types?.title} ({session.location_name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Booking Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              >
                <option value="confirmed">Confirmed</option>
                <option value="attended">Attended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={createBookingMutation.isPending}
            className="flex w-full h-11 items-center justify-center rounded-sm bg-accent text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 gap-2"
          >
            {createBookingMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" /> Log Booking
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
