import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Fetch user profile to read role
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Error reading profile role:", profileError);
          toast.success("Signed in successfully!");
          router.navigate({ to: "/dashboard" });
        } else {
          toast.success("Welcome back!");
          if (profile.role === "admin") {
            router.navigate({ to: "/admin/dashboard" });
          } else {
            router.navigate({ to: "/dashboard" });
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-sm border border-border bg-surface p-8 shadow-lg">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Alex Moreno
          </Link>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome back. Train hard.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full h-10 items-center justify-center rounded-sm bg-accent text-[13px] font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  Sign In <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-accent transition-colors hover:text-accent/80">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
