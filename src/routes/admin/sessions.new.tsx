import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/sessions/new")({
  component: AdminSessionsNewPage,
});

function AdminSessionsNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focus, setFocus] = useState<"Strength" | "Conditioning" | "Mobility">("Strength");
  const [locationType, setLocationType] = useState<"Studio" | "Outdoor">("Studio");
  const [locationName, setLocationName] = useState("");
  const [pricing, setPricing] = useState("35.00");
  const [maxSlots, setMaxSlots] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Availability rule (optional)
  const [addRule, setAddRule] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:00");

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      // 1. Insert session type template
      const { data: template, error: templateError } = await supabase
        .from("session_types")
        .insert({
          title,
          description,
          focus,
          location_type: locationType,
          location_name: locationName,
          pricing: parseFloat(pricing),
          max_slots: maxSlots,
          duration_minutes: durationMinutes,
          is_active: true,
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // 2. Insert availability rule if requested
      if (addRule && template) {
        const { error: ruleError } = await supabase.from("availability_rules").insert({
          session_type_id: template.id,
          day_of_week: dayOfWeek,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
        });

        if (ruleError) throw ruleError;
      }

      return template;
    },
    onSuccess: () => {
      toast.success("Training template created successfully!");
      router.navigate({ to: "/admin/sessions" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create template.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !locationName) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createTemplateMutation.mutate();
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
            Create Template
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Define a reusable personal training session format configuration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Main info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Session Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Morning Strength Conditioning"
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Outline details, level of focus, equipment needed..."
                rows={3}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Training Focus
              </label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value as any)}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              >
                <option value="Strength">Strength</option>
                <option value="Conditioning">Conditioning</option>
                <option value="Mobility">Mobility</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Pricing (€) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Location Type
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as any)}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              >
                <option value="Studio">Studio (Indoor)</option>
                <option value="Outdoor">Outdoor (Park/Beach)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Location Name *
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="E.g. Barceloneta Beach, Eixample Studio"
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Max Slots *
              </label>
              <input
                type="number"
                required
                min={1}
                value={maxSlots}
                onChange={(e) => setMaxSlots(parseInt(e.target.value))}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                required
                min={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                className="mt-1.5 block w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Optional availability slot rule */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="add-rule"
                checked={addRule}
                onChange={(e) => setAddRule(e.target.checked)}
                className="h-4 w-4 rounded-sm border-border bg-background text-accent focus:ring-accent"
              />
              <label
                htmlFor="add-rule"
                className="text-xs font-semibold uppercase tracking-wider text-foreground select-none cursor-pointer"
              >
                Define weekly recurring availability slot
              </label>
            </div>

            {addRule && (
              <div className="grid gap-4 sm:grid-cols-3 bg-background/50 p-4 rounded-sm border border-border">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Day of Week
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                    className="mt-1.5 block w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                    <option value={0}>Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1.5 block w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1.5 block w-full rounded-sm border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={createTemplateMutation.isPending}
            className="flex w-full h-11 items-center justify-center rounded-sm bg-accent text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 gap-2"
          >
            {createTemplateMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Template
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
