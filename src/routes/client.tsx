import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2, LogOut, LayoutDashboard, User, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/client")({
  component: ClientLayout,
});

function ClientLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please sign in to access the client area.");
        router.navigate({ to: "/login" });
      } else if (profile) {
        if (profile.status === "banned" || profile.status === "rejected") {
          toast.error("Access denied. Your account is restricted.");
          signOut().then(() => {
            router.navigate({ to: "/blocked" });
          });
        } else if (profile.role !== "client" && profile.role !== "user") {
          toast.error("Unauthorized access. Redirecting...");
          if (profile.role === "admin") {
            router.navigate({ to: "/admin/dashboard" });
          } else {
            router.navigate({ to: "/login" });
          }
        }
      }
    }
  }, [user, profile, loading, router, signOut]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (
    !user ||
    (profile && profile.role !== "client" && profile.role !== "user") ||
    (profile && profile.status !== "active")
  ) {
    return null; // Let the redirect handle it
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Client Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Alex Moreno <span className="text-muted-foreground font-normal">· Client Portal</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/client/dashboard"
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-semibold"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              to="/client/bookings"
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-semibold"
            >
              <Calendar className="h-4 w-4" />
              Bookings
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-semibold"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <Link
              to="/logout"
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Basic Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Alex Moreno · Client Portal
      </footer>
    </div>
  );
}
