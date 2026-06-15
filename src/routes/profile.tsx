import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Camera, User, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not logged in");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["client-dashboard-bookings", user?.id] });

      // Redirect back to dashboard based on role
      if (profile?.role === "admin") {
        router.navigate({ to: "/admin/dashboard" });
      } else {
        router.navigate({ to: "/client/dashboard" });
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update profile.");
    },
  });

  // Upload avatar file
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!user) throw new Error("User required");

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      // Important: Path must start with user.id to satisfy RLS policies!
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload file to Supabase storage bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      toast.success("Avatar uploaded! Remember to save changes.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload avatar.";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <h1 className="text-xl font-bold font-display">Authentication Required</h1>
        <Link to="/login" className="mt-4 text-accent hover:underline">
          Go to Sign In
        </Link>
      </div>
    );
  }

  const backLink = profile?.role === "admin" ? "/admin/dashboard" : "/client/dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <Link
          to={backLink}
          className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 text-accent" /> Back to Dashboard
        </Link>

        <div className="rounded-sm border border-border bg-surface p-8 shadow-lg space-y-8">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Edit Profile
            </h1>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Manage your personal credentials and trainer avatar representation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar uploader */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group h-24 w-24 rounded-sm border border-border overflow-hidden bg-background flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}

                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 bg-surface/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 cursor-pointer transition-opacity text-[10px] uppercase font-bold tracking-wider text-accent"
                >
                  <Camera className="h-5 w-5" />
                  Upload
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              {uploading && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin text-accent" /> Uploading image...
                </span>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-accent" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground/50 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-accent" /> Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  className="mt-1.5 block w-full rounded-sm border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
                />
                <span className="block text-[10px] text-muted-foreground mt-1">
                  Email address updates must be requested with support.
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-accent" /> Account Created
                </label>
                <input
                  type="text"
                  disabled
                  value={profile ? format(new Date(profile.created_at), "MMMM d, yyyy") : ""}
                  className="mt-1.5 block w-full rounded-sm border border-border bg-background/50 px-3 py-2 text-sm text-muted-foreground focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updateProfileMutation.isPending || uploading}
              className="flex w-full h-10 items-center justify-center rounded-sm bg-accent text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
