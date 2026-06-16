import { createFileRoute, Outlet, Link, useRouter, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import {
  Loader2,
  LogOut,
  LayoutDashboard,
  Shield,
  Calendar,
  Users,
  Settings,
  BarChart3,
  User,
  Bell,
} from "lucide-react";
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

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const location = useLocation();

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
    // e.g. ["admin", "sessions", "new"]
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
        {/* Sidebar */}
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center justify-center px-4 py-0">
            <Link to="/" className="flex items-center gap-2 text-sm font-semibold w-full overflow-hidden">
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Alex Moreno</span>
              <span className="text-accent uppercase tracking-wider font-semibold text-[10px] bg-accent/10 px-2 py-0.5 rounded-sm flex items-center gap-1 shrink-0 group-data-[collapsible=icon]:hidden">
                <Shield className="h-3 w-3" /> Admin
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === "/admin/dashboard"}>
                      <Link to="/admin/dashboard">
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/admin/bookings")}>
                      <Link to="/admin/bookings">
                        <Calendar />
                        <span>Bookings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/admin/clients")}>
                      <Link to="/admin/clients">
                        <Users />
                        <span>Clients</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/admin/sessions")}>
                      <Link to="/admin/sessions">
                        <Calendar />
                        <span>Templates</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/admin/reporting")}>
                      <Link to="/admin/reporting">
                        <BarChart3 />
                        <span>Reporting</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname.startsWith("/admin/settings")}>
                      <Link to="/admin/settings">
                        <Settings />
                        <span>Settings</span>
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
              {/* Notification Center (Mockup) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative flex items-center justify-center h-8 w-8 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground hover:border-accent transition-colors focus:outline-none">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent animate-pulse" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-surface border-border p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications</span>
                    <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-sm font-semibold">2 New</span>
                  </div>
                  <div className="flex flex-col max-h-[300px] overflow-auto">
                    <div className="px-4 py-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors">
                      <p className="text-sm font-medium">New Client Registered</p>
                      <p className="text-xs text-muted-foreground mt-1">David Smith just created an account.</p>
                      <span className="text-[10px] text-muted-foreground/70 mt-2 block">2 mins ago</span>
                    </div>
                    <div className="px-4 py-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors">
                      <p className="text-sm font-medium">Booking Cancelled</p>
                      <p className="text-xs text-muted-foreground mt-1">Sarah Johnson cancelled her 17:00 session.</p>
                      <span className="text-[10px] text-muted-foreground/70 mt-2 block">1 hour ago</span>
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-accent py-2 transition-colors">
                      Mark all as read
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-full cursor-pointer">
                    <Avatar className="h-8 w-8 border border-border transition-colors hover:border-accent">
                      {profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt={profile.full_name || "Admin"} />
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
