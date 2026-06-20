import React, { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  CreditCard,
  Tag,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

interface BookingDetailsModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onCancelClick?: () => void;
}

export function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onCancelClick,
}: BookingDetailsModalProps) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleClose = () => {
    setIsRescheduling(false);
    setSelectedSessionId(null);
    onClose();
  };

  const { data: availableSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["available-sessions", booking?.scheduled_sessions?.id],
    enabled: isRescheduling && !!booking?.scheduled_sessions?.id,
    queryFn: async () => {
      let typeId =
        booking.scheduled_sessions.session_type_id || booking.scheduled_sessions.session_types?.id;

      if (!typeId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from("scheduled_sessions")
          .select("session_type_id")
          .eq("id", booking.scheduled_sessions.id)
          .single();

        if (sessionError) throw sessionError;
        typeId = sessionData.session_type_id;
      }

      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(
          `
          id,
          start_time,
          end_time,
          location_name,
          max_slots,
          status,
          bookings (id, status)
        `,
        )
        .eq("session_type_id", typeId)
        .eq("status", "published")
        .gt("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;

      return (data as any[]).filter((session) => {
        const confirmedBookings =
          session.bookings?.filter((b: any) => b.status === "confirmed") || [];
        return confirmedBookings.length < (session.max_slots || 0);
      });
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async (newSessionId: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ scheduled_session_id: newSessionId })
        .eq("id", booking.id);

      if (error) throw error;
      return newSessionId;
    },
    onSuccess: () => {
      toast.success("Booking rescheduled successfully!");
      queryClient.invalidateQueries();
      handleClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reschedule booking.");
    },
  });

  if (!booking) return null;

  const startTime = new Date(booking.scheduled_sessions?.start_time || booking.created_at);
  const endTime = booking.scheduled_sessions?.end_time
    ? new Date(booking.scheduled_sessions.end_time)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-surface/95 backdrop-blur-xl border-border/40 shadow-2xl overflow-hidden p-0">
        {isRescheduling ? (
          <div className="flex flex-col max-h-[85vh]">
            <div className="p-6 pb-4 border-b border-border/30 bg-surface/50">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-background/80"
                  onClick={() => setIsRescheduling(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <DialogTitle className="font-display text-xl">Reschedule Session</DialogTitle>
                  <DialogDescription className="mt-1">
                    Select a new time for {booking.profiles?.full_name || "this client"}
                  </DialogDescription>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isLoadingSessions ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
                  <p className="text-sm">Finding available sessions...</p>
                </div>
              ) : availableSessions?.length === 0 ? (
                <div className="text-center py-12 bg-background/30 rounded-xl border border-dashed border-border/50">
                  <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No upcoming sessions available.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSessions?.map((session) => {
                    const sessionStart = new Date(session.start_time);
                    const isSelected = selectedSessionId === session.id;
                    const confirmedBookings =
                      session.bookings?.filter((b: any) => b.status === "confirmed") || [];
                    const slotsLeft = (session.max_slots || 0) - confirmedBookings.length;

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? "border-accent bg-accent/5 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]"
                            : "border-border/40 bg-surface hover:border-accent/40 hover:bg-surface/80"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-foreground group-hover:text-accent transition-colors">
                            {format(sessionStart, "EEEE, MMMM d, yyyy")}
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-accent" />}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md">
                            <Clock className="h-3.5 w-3.5" />
                            {format(sessionStart, "h:mm a")}
                          </span>
                          <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md">
                            <User className="h-3.5 w-3.5" />
                            {slotsLeft} slots left
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border/30 bg-surface/50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsRescheduling(false)}
                className="border-border/50"
              >
                Cancel
              </Button>
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90 min-w-[140px]"
                disabled={!selectedSessionId || rescheduleMutation.isPending}
                onClick={() => selectedSessionId && rescheduleMutation.mutate(selectedSessionId)}
              >
                {rescheduleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming
                  </>
                ) : (
                  "Confirm Reschedule"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="p-6 pb-5 border-b border-border/30 bg-gradient-to-b from-surface/80 to-surface/40">
              <DialogHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="font-display text-2xl flex items-center gap-2">
                      Booking Details
                    </DialogTitle>
                    <DialogDescription className="mt-1 flex items-center gap-2">
                      <span className="font-mono text-xs opacity-70">
                        ID: {booking.id.split("-")[0]}...
                      </span>
                    </DialogDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={`px-3 py-1 shadow-sm ${
                      booking.status === "confirmed"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase tracking-widest text-[10px]"
                        : booking.status === "attended"
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase tracking-widest text-[10px]"
                          : "bg-rose-500/10 text-rose-500 border-rose-500/20 uppercase tracking-widest text-[10px]"
                    }`}
                  >
                    {booking.status}
                  </Badge>
                </div>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6">
              {/* Payment Row */}
              <div className="flex items-center justify-between bg-background/40 p-4 rounded-xl border border-border/30 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${booking.payment_status === "paid" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                  >
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Payment Status
                    </span>
                    <span
                      className={`font-semibold ${booking.payment_status === "paid" ? "text-emerald-500" : "text-amber-500"}`}
                    >
                      {booking.payment_status?.toUpperCase() || "PENDING"}
                    </span>
                  </div>
                </div>
                {booking.scheduled_sessions?.session_types?.pricing && (
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">
                      Amount
                    </span>
                    <span className="font-display text-lg font-bold">
                      €{booking.scheduled_sessions.session_types.pricing}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    Client Info
                  </h4>
                  <div className="space-y-3 bg-surface/30 p-4 rounded-xl border border-border/20">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Name
                      </span>
                      <span className="font-medium text-sm">
                        {booking.profiles?.full_name || "Unknown Client"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Email
                      </span>
                      <span className="font-medium text-sm flex items-center gap-1.5 break-all">
                        {booking.profiles?.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Details */}
                <div className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Session Info
                  </h4>
                  <div className="space-y-3 bg-surface/30 p-4 rounded-xl border border-border/20">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Type
                      </span>
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-accent" />
                        {booking.scheduled_sessions?.session_types?.title || "Custom Session"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                        Time
                      </span>
                      <span className="font-medium text-sm flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-accent" />
                        {format(startTime, "MMM d, yyyy")} • {format(startTime, "h:mm a")}
                      </span>
                    </div>
                    {booking.scheduled_sessions?.location_name && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-0.5">
                          Location
                        </span>
                        <span className="font-medium text-sm flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          {booking.scheduled_sessions.location_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground/70 text-center pt-2 uppercase tracking-widest">
                Booked on {format(new Date(booking.created_at), "MMM d, yyyy 'at' HH:mm")}
              </div>
            </div>

            <div className="p-6 border-t border-border/30 bg-surface/50 flex flex-wrap gap-3 justify-end">
              <Button
                variant="outline"
                className="border-accent/30 text-accent hover:bg-accent/10 hover:text-accent transition-colors"
                onClick={() => setIsRescheduling(true)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Reschedule
              </Button>
              {onCancelClick && (
                <Button
                  variant="destructive"
                  className="bg-destructive/90 hover:bg-destructive shadow-sm"
                  onClick={onCancelClick}
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
