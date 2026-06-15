import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in -> Redirect to login
        router.navigate({ to: "/login" });
      } else if (profile) {
        // Logged in -> Redirect to correct role-based dashboard
        if (profile.role === "admin") {
          router.navigate({ to: "/admin/dashboard" });
        } else {
          router.navigate({ to: "/client/dashboard" });
        }
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
        <p className="text-sm text-muted-foreground uppercase tracking-widest text-[10px]">
          Loading dashboard...
        </p>
      </div>
    </div>
  );
}
