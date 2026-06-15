import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, User, Clock, MapPin, Award } from "lucide-react";

export const Route = createFileRoute("/client/dashboard")({
  component: ClientDashboard,
});

function ClientDashboard() {
  const { user, profile } = useAuth();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome back, <span className="text-accent">{profile?.full_name || user?.email}</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track your personal training schedule, bookings, and progress.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        {/* Left column: Profile details */}
        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <User className="h-4 w-4" /> Profile Info
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">Full Name</span>
                <span className="font-medium text-foreground">{profile?.full_name || "N/A"}</span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">Email Address</span>
                <span className="font-medium text-foreground">{profile?.email}</span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">Account Status</span>
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent uppercase tracking-wider mt-1">
                  {profile?.status}
                </span>
              </div>
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">Assigned Role</span>
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2 py-0.5 text-xs font-semibold text-foreground uppercase tracking-wider mt-1">
                  {profile?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Award className="h-4 w-4" /> Training Streak
            </h3>
            <p className="text-3xl font-display font-semibold text-foreground">0</p>
            <p className="mt-1 text-xs text-muted-foreground">Sessions completed. Book a session to get started!</p>
          </div>
        </div>

        {/* Right column: Upcoming bookings & waitlist */}
        <div className="space-y-8">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Upcoming Bookings
            </h2>

            {/* Mocked Empty State */}
            <div className="flex flex-col items-center justify-center border border-dashed border-border py-12 text-center rounded-sm">
              <Calendar className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">No upcoming bookings</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs px-4">
                You don't have any sessions scheduled for this week yet.
              </p>
              <a
                href="/#schedule"
                className="mt-4 inline-flex h-9 items-center rounded-sm bg-accent px-4 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
              >
                Find a slot
              </a>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Waitlist Status
            </h2>

            {/* Mocked Empty State */}
            <div className="flex flex-col items-center justify-center border border-dashed border-border py-12 text-center rounded-sm">
              <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-semibold text-foreground">No waitlisted sessions</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs px-4">
                When a session is full, you can join the waitlist here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
