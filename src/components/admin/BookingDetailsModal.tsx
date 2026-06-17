import React from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, User, Mail, CreditCard, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BookingDetailsModalProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingDetailsModal({ booking, isOpen, onClose }: BookingDetailsModalProps) {
  if (!booking) return null;

  const startTime = new Date(booking.scheduled_sessions?.start_time || booking.created_at);
  const endTime = booking.scheduled_sessions?.end_time 
    ? new Date(booking.scheduled_sessions.end_time) 
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            Booking Details
          </DialogTitle>
          <DialogDescription>
            ID: {booking.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Status Row */}
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
              <Badge
                variant="outline"
                className={
                  booking.status === "confirmed"
                    ? "bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase"
                    : booking.status === "attended"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20 uppercase"
                }
              >
                {booking.status}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Payment</span>
              <Badge
                variant="outline"
                className={
                  booking.payment_status === "paid"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase"
                }
              >
                {booking.payment_status || "pending"}
              </Badge>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Client Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
              <User className="h-4 w-4 text-primary" />
              Client Information
            </h4>
            <div className="grid gap-2 pl-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{booking.profiles?.full_name || "Unknown Client"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {booking.profiles?.email}
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Session Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
              <Calendar className="h-4 w-4 text-primary" />
              Session Details
            </h4>
            <div className="grid gap-2 pl-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-muted-foreground" />
                  {booking.scheduled_sessions?.session_types?.title || "Custom Session"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(startTime, "EEEE, MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {format(startTime, "h:mm a")} {endTime && `- ${format(endTime, "h:mm a")}`}
                </span>
              </div>
              {booking.scheduled_sessions?.location_name && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {booking.scheduled_sessions.location_name}
                  </span>
                </div>
              )}
              {booking.scheduled_sessions?.session_types?.pricing && (
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <CreditCard className="h-3 w-3 text-muted-foreground" />
                    ${booking.scheduled_sessions.session_types.pricing}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center mt-2 pt-4 border-t border-border/30">
            Booked on {format(new Date(booking.created_at), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
