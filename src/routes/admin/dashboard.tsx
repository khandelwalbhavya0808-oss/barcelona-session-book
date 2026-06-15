import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Users, Calendar, TrendingUp, Settings, Plus, UserCheck } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage training slots, client accounts, waitlists, and view occupancy.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-4 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90">
            <Plus className="h-4 w-4" /> Create Session
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border px-4 text-xs font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-accent hover:text-accent">
            <Settings className="h-4 w-4" /> System Settings
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-3 mb-10">
        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Clients</span>
            <Users className="h-5 w-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-semibold text-foreground">24</p>
          <p className="mt-1 text-xs text-muted-foreground">+3 registered this week</p>
        </div>

        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Bookings</span>
            <Calendar className="h-5 w-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-semibold text-foreground">18</p>
          <p className="mt-1 text-xs text-muted-foreground">90% of capacity filled</p>
        </div>

        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed Ratio</span>
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-semibold text-foreground">95%</p>
          <p className="mt-1 text-xs text-muted-foreground">Low no-show rate</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        {/* Left Column: Mock Schedule */}
        <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Today's Scheduled Sessions
          </h2>
          
          <div className="space-y-4">
            {[
              { time: "07:00", name: "Morning Strength", type: "Studio", filled: "1/1", coach: "Alex Moreno" },
              { time: "09:30", name: "Beach Conditioning", type: "Outdoor", filled: "1/2", coach: "Alex Moreno" },
              { time: "18:30", name: "Upper Body Blast", type: "Studio", filled: "0/1", coach: "Alex Moreno" },
            ].map((s) => (
              <div key={s.time} className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-4">
                  <span className="font-display font-semibold text-lg text-accent w-14">{s.time}</span>
                  <div>
                    <h3 className="font-semibold text-sm">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.type} · Coach: {s.coach}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded-sm">
                    {s.filled} Slots
                  </span>
                  <button className="inline-flex h-7 items-center justify-center rounded-sm border border-border px-3 text-[10px] uppercase font-semibold tracking-wider hover:border-accent hover:text-accent">
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Admin Profile Verification */}
        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Authorized Session
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium pb-2 border-b border-border">
                <UserCheck className="h-4 w-4 text-accent" />
                <span>Logged in as Admin</span>
              </div>
              <div className="pt-1">
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Name</span>
                <span className="text-foreground font-semibold text-sm">{profile?.full_name || "Alex Moreno"}</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Admin Email</span>
                <span className="text-foreground">{profile?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
