import { createFileRoute, Outlet, Link, useRouter, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2, LogOut, LayoutDashboard, User, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const Route = createFileRoute("/client")({
  component: ClientLayout,
});

function ClientLayout() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const location = useLocation();

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

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    const parts = path.split("/").filter(Boolean);
    return parts.map((part, index) => {
      const href = "/" + parts.slice(0, index + 1).join("/");
      const label = part.charAt(0).toUpperCase() + part.slice(1);
      const isLast = index === parts.length - 1;
      return { href, label, isLast };
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        {/* Left Sidebar */}
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-center px-4 py-0">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold w-full overflow-hidden">
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="truncate group-data-[collapsible=icon]:hidden font-display">Alex Moreno</span>
              <span className="text-accent uppercase tracking-wider font-semibold text-[9px] bg-accent/10 px-2 py-0.5 rounded-sm flex items-center gap-1 shrink-0 group-data-[collapsible=icon]:hidden">
                Client
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Portal Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/client/dashboard"}>
                      <Link to="/client/dashboard">
                        <LayoutDashboard className="h-4 w-4 text-accent" />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/client/book"}>
                      <Link to="/client/book">
                        <Plus className="h-4 w-4 text-accent" />
                        <span>Book a Session</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/client/bookings")}>
                      <Link to="/client/bookings">
                        <Calendar className="h-4 w-4 text-accent" />
                        <span>Bookings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/profile"}>
                      <Link to="/profile">
                        <User className="h-4 w-4 text-accent" />
                        <span>Profile Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>
                  {getBreadcrumbs().map((bc, idx) => (
                    <div key={bc.href} className="flex items-center gap-1.5">
                      {idx > 0 && <BreadcrumbSeparator />}
                      <BreadcrumbItem>
                        {bc.isLast ? (
                          <BreadcrumbPage className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{bc.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={bc.href} className="text-xs uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors">{bc.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-4">
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-full cursor-pointer">
                    <Avatar className="h-8 w-8 border border-border transition-colors hover:border-accent">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name || "Client"} />
                      ) : null}
                      <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/profile"
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <User className="h-3.5 w-3.5 text-accent" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem asChild>
                    <Link
                      to="/logout"
                      className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/5"
                    >
                      <LogOut className="h-3.5 w-3.5 text-accent" />
                      Log Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-background p-4 sm:p-6 md:p-8">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground bg-background">
            © {new Date().getFullYear()} Alex Moreno · Client Portal
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
