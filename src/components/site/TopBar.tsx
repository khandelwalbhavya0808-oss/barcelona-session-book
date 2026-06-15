import { useState } from "react";
import { Menu, X, User, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const NAV = [
  { label: "About", href: "#about" },
  { label: "Schedule", href: "#schedule" },
  { label: "Reviews", href: "#reviews" },
  { label: "Details", href: "#details" },
  { label: "Reschedule", href: "#book" },
];

export function TopBar() {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();

  const getDashboardPath = () => {
    return profile?.role === "admin" ? "/admin/dashboard" : "/dashboard";
  };

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

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 text-sm">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-display text-[15px] font-semibold tracking-tight">Alex Moreno</span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground md:inline">
            · S&amp;C Coach
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-full cursor-pointer">
                  <Avatar className="h-8 w-8 border border-border transition-colors hover:border-accent">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-[11px] font-semibold text-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-surface border-border">
                {(profile?.role === "user" || profile?.role === "client") && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/dashboard"
                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <LayoutDashboard className="h-3.5 w-3.5 text-accent" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                  </>
                )}
                {profile?.role === "admin" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Shield className="h-3.5 w-3.5 text-accent" />
                        Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                  </>
                )}
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
          ) : (
            <Link
              to="/login"
              className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </Link>
          )}
          <a
            href="#book"
            className="hidden h-9 items-center rounded-sm bg-accent px-5 text-[13px] font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Book
          </a>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3 sm:px-6">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 text-sm uppercase tracking-[0.14em] text-muted-foreground last:border-0 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}

            {user ? (
              <>
                {(profile?.role === "user" || profile?.role === "client") && (
                  <Link
                    to="/dashboard"
                    onClick={() => setOpen(false)}
                    className="border-b border-border/60 py-3 text-sm uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                )}
                {profile?.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="border-b border-border/60 py-3 text-sm uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-3 text-sm uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                >
                  Profile
                </Link>
                <Link
                  to="/logout"
                  onClick={() => setOpen(false)}
                  className="border-b border-border/60 py-3 text-sm uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                >
                  Log Out
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 text-sm uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
              >
                Login
              </Link>
            )}
            <a
              href="#book"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex h-10 items-center justify-center rounded-sm bg-accent px-5 text-sm font-semibold uppercase tracking-wider text-accent-foreground"
            >
              Book a Session
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
