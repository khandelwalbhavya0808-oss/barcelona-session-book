import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

function LogoutPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const performSignOut = async () => {
      try {
        await signOut();
        if (active) {
          toast.success("Logged out successfully.");
          router.navigate({ to: "/login" });
        }
      } catch (err: any) {
        console.error("Logout error:", err);
        if (active) {
          router.navigate({ to: "/login" });
        }
      }
    };

    performSignOut();

    return () => {
      active = false;
    };
  }, [signOut, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
        <p className="text-sm text-muted-foreground">Signing you out...</p>
      </div>
    </div>
  );
}
