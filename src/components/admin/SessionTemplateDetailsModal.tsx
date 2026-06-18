import React from "react";
import { format } from "date-fns";
import { Tag, MapPin, Clock, CreditCard, Activity, Users, Edit2, Copy, Trash2 } from "lucide-react";
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
import { Link } from "@tanstack/react-router";

interface SessionTemplateDetailsModalProps {
  template: any;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionTemplateDetailsModal({ template, isOpen, onClose }: SessionTemplateDetailsModalProps) {
  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-surface border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            Template Details
          </DialogTitle>
          <DialogDescription>
            ID: {template.id}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Status Row */}
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
              <Badge
                variant={template.is_active ? "default" : "secondary"}
                className={
                  template.is_active
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 uppercase"
                    : "bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase"
                }
              >
                {template.is_active ? "Active" : "Draft"}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Focus</span>
              <Badge variant="outline" className="uppercase border-border">
                {template.focus || "General"}
              </Badge>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
              <Tag className="h-4 w-4 text-primary" />
              General Information
            </h4>
            <div className="grid gap-2 pl-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Title</span>
                <span className="font-medium">{template.title}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium text-right max-w-[200px] truncate" title={template.description}>
                  {template.description || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {template.location_name} ({template.location_type})
                </span>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Configuration */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
              <Activity className="h-4 w-4 text-primary" />
              Configuration
            </h4>
            <div className="grid gap-2 pl-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {template.duration_minutes} min
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max Slots</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  {template.max_slots} clients
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Default Capacity</span>
                <span className="font-medium flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  {template.capacity || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium flex items-center gap-1.5">
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  €{template.pricing}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center mt-2 pt-4 border-t border-border/30">
            Created on {format(new Date(template.created_at), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>

        <DialogFooter className="sm:justify-between border-t border-border/50 pt-4 flex-wrap gap-2">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link to={`/admin/sessions/edit/${template.id}`}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Details
            </Link>
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="secondary" className="flex-1 sm:flex-none">
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button variant="destructive" className="flex-1 sm:flex-none">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
