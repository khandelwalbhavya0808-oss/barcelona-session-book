import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAdminSessionTypesFn, scheduleSessionFn } from "@/lib/api/admin.functions";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, CalendarIcon } from "lucide-react";

export const Route = createFileRoute("/admin/sessions/schedule")({
  component: AdminSessionsSchedulePage,
});

function AdminSessionsSchedulePage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["admin-session-types"],
    queryFn: async () => await getAdminSessionTypesFn(),
  });

  const activeTemplates = templates?.filter((t: any) => t.is_active) || [];

  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const selectedTemplate = activeTemplates.find((t: any) => t.id === templateId);
      if (!selectedTemplate) throw new Error("Template not found");

      // Combine date and time
      const startDateTime = new Date(`${date}T${time}:00`).toISOString();
      const endDateTime = new Date(new Date(`${date}T${time}:00`).getTime() + selectedTemplate.duration_minutes * 60000).toISOString();

      const res = await scheduleSessionFn({
        data: {
          sessionTypeId: templateId,
          startTime: startDateTime,
          endTime: endDateTime,
          maxSlots: selectedTemplate.max_slots,
          locationName: selectedTemplate.location_name,
        }
      });
      return res;
    },
    onSuccess: () => {
      toast.success("Session scheduled successfully!");
      router.navigate({ to: "/admin/dashboard" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to schedule session.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId || !date || !time) {
      toast.error("Please fill in all fields.");
      return;
    }
    scheduleMutation.mutate();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        to="/admin/sessions"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 text-accent" /> Back to Templates
      </Link>

      <div className="rounded-sm border border-border bg-surface p-8 shadow-lg space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Schedule Session
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a specific instance of a session template on the calendar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Template *
              </label>
              {templatesLoading ? (
                <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin"/> Loading...</div>
              ) : (
                <select
                  required
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="" disabled>-- Choose a Template --</option>
                  {activeTemplates.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.duration_minutes} min, {t.location_name})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Time *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={scheduleMutation.isPending}
            className="flex w-full h-11 items-center justify-center rounded-sm bg-accent text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 gap-2"
          >
            {scheduleMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CalendarIcon className="h-4 w-4" /> Schedule Session
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
