import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import {
  MapPin,
  Clock,
  ArrowLeft,
  Loader2,
  Calendar,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetailPage,
});

function SessionDetailPage() {
  const { sessionId } = Route.useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<"book" | "waitlist">("book");

  // Fetch Session details
  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["session-details", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(
          `
          *,
          session_types (
            title,
            description,
            focus,
            location_type,
            pricing,
            duration_minutes
          ),
          bookings (
            id,
            client_id,
            status
          ),
          waitlists (
            id,
            client_id,
            status
          )
        `,
        )
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data as any;
    },
  });

  const confirmedBookings = session?.bookings?.filter((b: any) => b.status === "confirmed") || [];
  const activeWaitlist = session?.waitlists?.filter((w: any) => w.status === "waiting") || [];

  const isFull = confirmedBookings.length >= (session?.max_slots || 0);
  const hasBooked = user ? confirmedBookings.some((b: any) => b.client_id === user.id) : false;
  const hasWaitlisted = user ? activeWaitlist.some((w: any) => w.client_id === user.id) : false;

  // Book session mutation
  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Authentication required.");
      if (profile?.status === "banned" || profile?.status === "rejected") {
        throw new Error("Your account is restricted from making bookings.");
      }

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          scheduled_session_id: sessionId,
          client_id: user.id,
          status: "confirmed",
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Session booked successfully! Payment is pending on-premises.");
      queryClient.invalidateQueries({ queryKey: ["session-details", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["client-bookings", user?.id] });
      router.navigate({ to: "/client/dashboard" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to book session.");
    },
  });

  // Join waitlist mutation
  const waitlistMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Authentication required.");
      if (profile?.status === "banned" || profile?.status === "rejected") {
        throw new Error("Your account is restricted from joining waitlists.");
      }

      // Calculate position
      const position = activeWaitlist.length + 1;

      const { data, error } = await supabase
        .from("waitlists")
        .insert({
          scheduled_session_id: sessionId,
          client_id: user.id,
          status: "waiting",
          position: position,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(
        "Joined waitlist successfully! You will be automatically promoted if a slot opens.",
      );
      queryClient.invalidateQueries({ queryKey: ["session-details", sessionId] });
      router.navigate({ to: "/client/dashboard" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to join waitlist.");
    },
  });

  const handleActionClick = () => {
    if (!user) {
      toast.info("Please sign in to continue booking.");
      router.navigate({ to: "/login" });
      return;
    }
    setActionType(isFull ? "waitlist" : "book");
    setConfirmOpen(true);
  };

  const handleConfirmAction = () => {
    setConfirmOpen(false);
    if (actionType === "book") {
      bookMutation.mutate();
    } else {
      waitlistMutation.mutate();
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold font-display">Session Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          The requested training session slot could not be found or has been deleted.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to timetable
        </Link>
      </div>
    );
  }

  const startDate = new Date(session.start_time);
  const endDate = new Date(session.end_time);

  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 text-accent" /> Back to Timetable
        </Link>

        <div className="rounded-sm border border-border bg-surface p-8 shadow-lg space-y-8">
          {/* Header */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent uppercase tracking-wider mb-3">
              {session.session_types?.focus}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {session.session_types?.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {session.session_types?.description || "No description provided for this session."}
            </p>
          </div>

          {/* Logistics Grid */}
          <div className="grid gap-6 sm:grid-cols-2 border-t border-b border-border/50 py-6 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-accent shrink-0" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Date & Time
                </span>
                <span className="font-medium text-foreground">
                  {format(startDate, "EEEE, MMMM d, yyyy")}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")} (
                  {session.session_types?.duration_minutes} min)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-accent shrink-0" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Location
                </span>
                <span className="font-medium text-foreground">
                  {session.session_types?.location_type}
                </span>
                <span className="block text-xs text-muted-foreground">{session.location_name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DollarSign className="h-5 w-5 text-accent shrink-0" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Pricing
                </span>
                <span className="font-medium text-foreground">
                  €{Number(session.pricing).toFixed(2)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Paid on-premises (in-person)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-accent shrink-0" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                  Availability
                </span>
                <span className="font-medium text-foreground">
                  {session.max_slots - confirmedBookings.length} of {session.max_slots} slots
                  available
                </span>
                <span className="block text-xs text-muted-foreground">
                  {activeWaitlist.length} waiting on waitlist
                </span>
              </div>
            </div>
          </div>

          {/* Booking State Display */}
          {hasBooked ? (
            <div className="flex items-center gap-3 rounded-sm border border-accent/20 bg-accent/5 p-4 text-sm text-foreground">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
              <div>
                <span className="font-semibold">You have booked this session!</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  View and manage this booking in your{" "}
                  <Link
                    to="/client/dashboard"
                    className="font-semibold text-accent hover:underline"
                  >
                    Dashboard
                  </Link>
                  .
                </p>
              </div>
            </div>
          ) : hasWaitlisted ? (
            <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/20 p-4 text-sm text-foreground">
              <Clock className="h-5 w-5 text-accent shrink-0" />
              <div>
                <span className="font-semibold">You are on the waitlist!</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your current waitlist position is{" "}
                  <span className="text-accent font-semibold">
                    #{activeWaitlist.findIndex((w: any) => w.client_id === user?.id) + 1}
                  </span>
                  .
                </p>
              </div>
            </div>
          ) : profile?.status === "banned" || profile?.status === "rejected" ? (
            <div className="flex items-center gap-3 rounded-sm border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
              <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <span className="font-semibold">Account Restricted</span>
                <p className="text-xs text-destructive/80 mt-0.5">
                  Your profile has been banned or rejected. Please contact support.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={handleActionClick}
                disabled={bookMutation.isPending || waitlistMutation.isPending}
                className="flex w-full h-11 items-center justify-center rounded-sm bg-accent text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {bookMutation.isPending || waitlistMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isFull ? (
                  "Join Waitlist"
                ) : (
                  "Book Session"
                )}
              </button>
              <p className="text-[11px] text-center text-muted-foreground mt-2.5">
                {isFull
                  ? "All slots are taken. Join the waitlist to get auto-booked if someone cancels."
                  : "Note: Cancellations must be made at least 12 hours before the start time."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-surface border border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-xl font-bold">
              {actionType === "book" ? "Confirm Booking" : "Join Waitlist"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              {actionType === "book"
                ? `Do you want to book "${session.session_types?.title}" on ${format(startDate, "MMMM d")} at ${format(startDate, "HH:mm")}? You will pay €${Number(session.pricing).toFixed(2)} in person on-premises.`
                : `This session is full. Would you like to join the waitlist at position #${activeWaitlist.length + 1}? You will be automatically booked if a slot opens.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-border text-foreground hover:bg-muted/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className="bg-accent text-accent-foreground hover:opacity-90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
