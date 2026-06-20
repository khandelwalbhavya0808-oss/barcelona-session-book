import { createFileRoute, Outlet, Link, useRouter, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Loader2, LogOut, LayoutDashboard, User, Calendar, Plus, Shield, Bell } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { format } from "date-fns";
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

  const [lastSeen, setLastSeen] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("client_notifications_last_seen") || "1970-01-01T00:00:00.000Z";
    }
    return "1970-01-01T00:00:00.000Z";
  });

  // Query: Fetch client bookings for notifications
  const { data: bookings } = useQuery({
    queryKey: ["client-notifications-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          created_at,
          scheduled_sessions (
            id,
            start_time,
            session_types (
              title
            )
          )
        `,
        )
        .eq("client_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Query: Fetch client waitlists for notifications
  const { data: waitlists } = useQuery({
    queryKey: ["client-notifications-waitlists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("waitlists")
        .select(
          `
          id,
          status,
          position,
          created_at,
          scheduled_sessions (
            id,
            start_time,
            session_types (
              title
            )
          )
        `,
        )
        .eq("client_id", user?.id || "")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  // Transform and combine bookings and waitlists into structured notifications
  const notifications = [
    ...(bookings || []).map((b: any) => {
      const title = b.scheduled_sessions?.session_types?.title || "Workout";
      const startTimeStr = b.scheduled_sessions?.start_time;
      const formattedSessionDate = startTimeStr
        ? format(new Date(startTimeStr), "MMM d 'at' h:mm a")
        : "";

      let notifTitle = "";
      let notifBody = "";

      switch (b.status) {
        case "confirmed":
          notifTitle = "📅 Session Booked";
          notifBody = `Your booking for ${title} on ${formattedSessionDate} is confirmed.`;
          break;
        case "cancelled":
        case "late_cancelled":
          notifTitle = "❌ Booking Cancelled";
          notifBody = `Your booking for ${title} on ${formattedSessionDate} was cancelled.`;
          break;
        case "attended":
          notifTitle = "💪 Session Attended";
          notifBody = `Great job! You attended ${title} on ${formattedSessionDate}.`;
          break;
        case "no-show":
          notifTitle = "⚠️ Session Missed";
          notifBody = `You were marked as a no-show for ${title} on ${formattedSessionDate}.`;
          break;
        default:
          notifTitle = "📅 Booking Update";
          notifBody = `Your booking status for ${title} is ${b.status}.`;
      }

      return {
        id: `booking-${b.id}`,
        title: notifTitle,
        body: notifBody,
        createdAt: new Date(b.created_at),
        type: "booking",
        status: b.status,
      };
    }),
    ...(waitlists || []).map((w: any) => {
      const title = w.scheduled_sessions?.session_types?.title || "Workout";
      const startTimeStr = w.scheduled_sessions?.start_time;
      const formattedSessionDate = startTimeStr
        ? format(new Date(startTimeStr), "MMM d 'at' h:mm a")
        : "";

      let notifTitle = "";
      let notifBody = "";

      switch (w.status) {
        case "waiting":
          notifTitle = "⏳ Waitlisted";
          notifBody = `You are at position #${w.position} for ${title} on ${formattedSessionDate}.`;
          break;
        case "booked":
          notifTitle = "🎉 Promoted to Session";
          notifBody = `You have been promoted from the waitlist for ${title} on ${formattedSessionDate}!`;
          break;
        case "cancelled":
          notifTitle = "❌ Waitlist Cancelled";
          notifBody = `Your waitlist request for ${title} on ${formattedSessionDate} was cancelled.`;
          break;
        default:
          notifTitle = "⏳ Waitlist Update";
          notifBody = `Your waitlist status for ${title} is ${w.status}.`;
      }

      return {
        id: `waitlist-${w.id}`,
        title: notifTitle,
        body: notifBody,
        createdAt: new Date(w.created_at),
        type: "waitlist",
        status: w.status,
      };
    }),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const unreadCount = notifications.filter(
    (n) => n.createdAt.getTime() > new Date(lastSeen).getTime(),
  ).length;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      const nowStr = new Date().toISOString();
      setLastSeen(nowStr);
      if (typeof window !== "undefined") {
        localStorage.setItem("client_notifications_last_seen", nowStr);
      }
    }
  };

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
        } else if (
          profile.role !== "client" &&
          profile.role !== "user" &&
          profile.role !== "admin"
        ) {
          toast.error("Unauthorized access. Redirecting...");
          router.navigate({ to: "/login" });
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
    (profile && profile.role !== "client" && profile.role !== "user" && profile.role !== "admin") ||
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
            <Link
              to="/"
              className="flex items-center gap-2 text-sm font-semibold w-full overflow-hidden"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              <span className="truncate group-data-[collapsible=icon]:hidden font-display">
                Alex Moreno
              </span>
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
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname.startsWith("/client/bookings")}
                    >
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
                          <BreadcrumbPage className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                            {bc.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link
                              to={bc.href}
                              className="text-xs uppercase tracking-wider text-muted-foreground/70 hover:text-foreground transition-colors"
                            >
                              {bc.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-4">
              {/* Notification Center */}
              <DropdownMenu onOpenChange={handleOpenChange}>
                <DropdownMenuTrigger asChild>
                  <button className="relative flex items-center justify-center h-8 w-8 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground hover:border-accent transition-colors focus:outline-none cursor-pointer">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-accent animate-pulse" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 bg-surface border-border p-0 shadow-lg"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-display">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-sm font-semibold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col max-h-[300px] overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-foreground">{n.title}</p>
                            <span className="text-[9px] text-muted-foreground shrink-0">
                              {format(n.createdAt, "MMM d")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-border">
                      <button
                        onClick={() => {
                          const nowStr = new Date().toISOString();
                          setLastSeen(nowStr);
                          if (typeof window !== "undefined") {
                            localStorage.setItem("client_notifications_last_seen", nowStr);
                          }
                        }}
                        className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-accent py-2 transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

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
                  {profile?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem asChild>
                        <Link
                          to="/admin/dashboard"
                          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Shield className="h-3.5 w-3.5 text-accent" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
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
