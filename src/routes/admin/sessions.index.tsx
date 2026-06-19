import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Eye, Edit2, Calendar as CalendarIcon, MapPin, Clock, DollarSign, Users, Filter } from "lucide-react";
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
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/sessions/")({
  component: AdminSessionsList,
});

function AdminSessionsList() {
  const [focusFilter, setFocusFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ["admin-scheduled-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(`
          *,
          session_types (
            id,
            title,
            description,
            focus,
            location_type,
            pricing,
            duration_minutes
          ),
          bookings (
            id,
            status
          )
        `)
        .order("start_time", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const displaySessions = (sessions || []).filter((session: any) => {
    // Focus Filter
    if (focusFilter !== "all" && session.session_types?.focus !== focusFilter) {
      return false;
    }
    // Status Filter
    if (statusFilter !== "all" && session.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Workout Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create, update, and manage your scheduled personal training and group workout sessions.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Focus filter */}
            <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 h-10">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={focusFilter} onValueChange={setFocusFilter}>
                <SelectTrigger className="h-8 w-[120px] border-0 bg-transparent shadow-none focus:ring-0 p-0 text-sm">
                  <SelectValue placeholder="Focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Focuses</SelectItem>
                  <SelectItem value="Strength">Strength</SelectItem>
                  <SelectItem value="Conditioning">Conditioning</SelectItem>
                  <SelectItem value="Mobility">Mobility</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-3 h-10">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[110px] border-0 bg-transparent shadow-none focus:ring-0 p-0 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/admin/sessions/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Session
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-surface shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[180px]">Date & Time</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading sessions...
                </TableCell>
              </TableRow>
            ) : displaySessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No sessions found.
                </TableCell>
              </TableRow>
            ) : (
              displaySessions.map((session: any) => {
                const confirmedCount = session.bookings?.filter(
                  (b: any) => b.status === "confirmed" || b.status === "attended"
                ).length || 0;
                
                return (
                  <TableRow 
                    key={session.id} 
                    className="border-border/50 hover:bg-muted/50"
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="flex items-center gap-1.5 text-foreground font-semibold">
                          <CalendarIcon className="h-3.5 w-3.5 text-accent" />
                          {format(new Date(session.start_time), "MMM d, yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5 ml-5">
                          {format(new Date(session.start_time), "HH:mm")} ({session.session_types?.duration_minutes} min)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{session.session_types?.title}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-wider font-bold">
                            {session.session_types?.focus}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-xs">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{session.location_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      €{Number(session.pricing).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {confirmedCount} / {session.max_slots} slots
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.status === "active" ? "default" : "secondary"}
                        className={
                          session.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20"
                        }
                      >
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          asChild
                        >
                          <Link to="/admin/sessions/$sessionId" params={{ sessionId: session.id }}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-accent"
                          asChild
                        >
                          <Link to={`/admin/sessions/edit/${session.id}`}>
                            <Edit2 className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
