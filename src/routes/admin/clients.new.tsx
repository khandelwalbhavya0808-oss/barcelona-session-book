import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { createClientFn } from "@/lib/api/admin.functions";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/clients/new")({
  component: AdminClientsNewPage,
});

function AdminClientsNewPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"user" | "client">("client");

  const createClientMutation = useMutation({
    mutationFn: async () => {
      return await createClientFn({
        data: {
          fullName,
          email,
          role,
        },
      });
    },
    onSuccess: () => {
      toast.success("Client added successfully!");
      router.navigate({ to: "/admin/clients" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add client.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createClientMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        to="/admin/clients"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 text-accent" /> Back to Clients
      </Link>

      <div className="rounded-sm border border-border bg-surface p-8 shadow-lg space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Add Client
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manually create a new client account. They will receive an email with their credentials if enabled.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="E.g. Jane Doe"
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Assign Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              >
                <option value="client">Client (Full Access)</option>
                <option value="user">User (Limited Access)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={createClientMutation.isPending}
            className="flex w-full h-11 items-center justify-center rounded-sm bg-accent text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 gap-2"
          >
            {createClientMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" /> Add Client
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
