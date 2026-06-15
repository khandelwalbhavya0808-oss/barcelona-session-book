import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, Home, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative w-full max-w-md space-y-8 rounded-sm border border-border bg-surface p-8 shadow-xl text-center overflow-hidden">
        {/* Glow border at the top of the card */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-destructive/50 to-transparent" />

        <div className="flex flex-col items-center">
          {/* Animated Warning Icon */}
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive mb-6 animate-pulse">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-destructive">
            Error 403
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
            Access Denied
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
            You do not have the administrative privileges required to access this section of the system.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-sm font-semibold tracking-wide uppercase text-xs h-10">
            <Link to="/dashboard">
              Go to Dashboard
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="w-full rounded-sm text-xs uppercase tracking-wider h-10">
              <Link to="/">
                <Home className="mr-1.5 h-3.5 w-3.5" /> Home
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full rounded-sm text-xs uppercase tracking-wider text-muted-foreground hover:text-accent h-10">
              <Link to="/logout">
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Logout
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t border-border/40 pt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Safety
          </Link>
        </div>
      </div>
    </div>
  );
}
