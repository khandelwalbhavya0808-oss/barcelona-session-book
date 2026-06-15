import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, Home, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/blocked")({
  component: BlockedPage,
});

function BlockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8 rounded-sm border border-border bg-surface p-8 shadow-xl text-center overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-destructive/50 to-transparent" />

        <div className="flex flex-col items-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive mb-6 animate-bounce">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-destructive">
            Status Restricted
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground">
            Account Restricted
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
            Your account has been rejected or banned by the administrator. All read/write privileges
            are restricted.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <div className="rounded-sm border border-border bg-background/50 p-4 text-xs text-muted-foreground flex items-start gap-2.5 text-left">
            <PhoneCall className="h-4 w-4 text-accent shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block">Need assistance?</span>
              Please contact Coach Alex Moreno in-person on-premises to appeal this decision or
              clarify your status.
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="w-full rounded-sm text-xs uppercase tracking-wider h-10"
          >
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
