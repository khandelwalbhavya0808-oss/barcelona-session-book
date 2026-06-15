import { createFileRoute, Outlet, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please sign in to access the administrator panel.");
      router.navigate({ to: "/login" });
    } else if (!loading && profile && profile.role !== "admin") {
      router.navigate({ to: "/unauthorized" });
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user || (profile && profile.role !== "admin")) {
    return null; // Let the redirect handle it
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Admin Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Alex Moreno <span className="text-accent uppercase tracking-wider font-semibold text-[10px] bg-accent/10 px-2 py-0.5 rounded-sm flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:font-semibold"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
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
        © {new Date().getFullYear()} Alex Moreno · Administrator Console
      </footer>
    </div>
  );
}
