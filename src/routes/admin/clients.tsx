import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { Users, Shield, Ban, CheckCircle2, User, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clients")({
  component: AdminClientsPage,
});

function AdminClientsPage() {
  const queryClient = useQueryClient();

  // Fetch clients
  const {
    data: clients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  // Toggle role/status mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({
      clientId,
      role,
      status,
      reason,
    }: {
      clientId: string;
      role?: string;
      status?: string;
      reason?: string;
    }) => {
      const updates: any = {};
      if (role) updates.role = role;
      if (status) updates.status = status;

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", clientId)
        .select()
        .single();

      if (error) throw error;

      // Note: Triggers automatically record client_status_history, but we could insert a log too.
      return data;
    },
    onSuccess: () => {
      toast.success("Client updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update client profile.");
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
        Failed to load clients. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Client Directory
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage roles, statuses, and review active client list.
          </p>
        </div>
      </div>

      <div className="rounded-sm border border-border bg-surface overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-background border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="p-4">Name / Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date Joined</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {clients?.map((client) => {
              let statusColor = "text-accent bg-accent/10 border-accent/20";
              if (client.status === "banned" || client.status === "rejected") {
                statusColor = "text-destructive bg-destructive/10 border-destructive/20";
              }

              return (
                <tr key={client.id} className="hover:bg-surface/50 transition-colors">
                  <td className="p-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-sm bg-background border border-border overflow-hidden flex items-center justify-center">
                        {client.avatar_url ? (
                          <img
                            src={client.avatar_url}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <span>{client.full_name || "N/A"}</span>
                        <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                          {client.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5">
                      {client.role === "admin" && <Shield className="h-3 w-3 text-accent" />}
                      {client.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-semibold uppercase tracking-wider text-[9px] border ${statusColor}`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {format(new Date(client.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      to="/admin/clients/$clientId"
                      params={{ clientId: client.id }}
                      className="inline-flex h-7 items-center justify-center rounded-sm border border-border px-3 text-[10px] uppercase font-semibold tracking-wider hover:border-accent hover:text-accent"
                    >
                      View Profile
                    </Link>

                    {/* Status Toggle Actions */}
                    {client.role !== "admin" && (
                      <>
                        {client.status === "active" ? (
                          <button
                            onClick={() =>
                              updateClientMutation.mutate({ clientId: client.id, status: "banned" })
                            }
                            className="inline-flex h-7 items-center justify-center rounded-sm border border-destructive/20 text-destructive bg-destructive/5 px-3 text-[10px] uppercase font-semibold tracking-wider hover:bg-destructive/10"
                          >
                            <Ban className="mr-1 h-3 w-3" /> Ban
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              updateClientMutation.mutate({ clientId: client.id, status: "active" })
                            }
                            className="inline-flex h-7 items-center justify-center rounded-sm border border-accent/20 text-accent bg-accent/5 px-3 text-[10px] uppercase font-semibold tracking-wider hover:bg-accent/10"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Activate
                          </button>
                        )}

                        {/* Promote/Demote */}
                        {client.role === "user" ? (
                          <button
                            onClick={() =>
                              updateClientMutation.mutate({ clientId: client.id, role: "client" })
                            }
                            className="inline-flex h-7 items-center justify-center rounded-sm border border-border px-3 text-[10px] uppercase font-semibold tracking-wider hover:border-accent hover:text-accent"
                          >
                            Promote to Client
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              updateClientMutation.mutate({ clientId: client.id, role: "user" })
                            }
                            className="inline-flex h-7 items-center justify-center rounded-sm border border-border px-3 text-[10px] uppercase font-semibold tracking-wider hover:border-destructive hover:text-destructive"
                          >
                            Demote to User
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
