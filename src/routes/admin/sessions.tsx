import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Loader2, Plus, Edit, ToggleLeft, ToggleRight, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sessions")({
  component: AdminSessionsListPage,
});

function AdminSessionsListPage() {
  const queryClient = useQueryClient();

  // Fetch templates
  const {
    data: sessionTypes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-session-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_types")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from("session_types")
        .update({ is_active: isActive })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Template active status toggled!");
      queryClient.invalidateQueries({ queryKey: ["admin-session-types"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update template.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-destructive">
        Failed to load session templates database. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Training Templates
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            CRUD core personal training formats and recurring scheduling slot patterns.
          </p>
        </div>

        <Link
          to="/admin/sessions/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-4 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Create New Template
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {sessionTypes?.map((type) => (
          <div
            key={type.id}
            className="rounded-sm border border-border bg-surface p-6 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-sm bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wider">
                  {type.focus}
                </span>

                <button
                  onClick={() =>
                    toggleActiveMutation.mutate({
                      id: type.id,
                      isActive: !type.is_active,
                    })
                  }
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={type.is_active ? "Deactivate" : "Activate"}
                >
                  {type.is_active ? (
                    <ToggleRight className="h-6 w-6 text-accent" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>
              </div>

              <h3 className="font-display font-semibold text-lg text-foreground mt-3">
                {type.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                {type.description || "No description provided."}
              </p>

              <div className="space-y-1.5 text-xs text-muted-foreground mt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <span>
                    Duration: {type.duration_minutes} min (Max {type.max_slots} slots)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>
                    {type.location_type} · {type.location_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                Base price: €{Number(type.pricing).toFixed(2)}
              </span>
              <Link
                to="/admin/sessions/edit/$typeId"
                params={{ typeId: type.id }}
                className="inline-flex h-8 items-center gap-1 rounded-sm border border-border px-3 text-[10px] uppercase font-semibold tracking-wider hover:border-accent hover:text-accent transition-colors"
              >
                <Edit className="h-3.5 w-3.5" /> Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
