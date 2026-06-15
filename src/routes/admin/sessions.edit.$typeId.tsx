import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Trash2, Plus, Calendar } from "lucide-react";

export const Route = createFileRoute("/admin/sessions/edit/$typeId")({
  component: AdminSessionsEditPage,
});

function AdminSessionsEditPage() {
  const { typeId } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focus, setFocus] = useState<"Strength" | "Conditioning" | "Mobility">("Strength");
  const [locationType, setLocationType] = useState<"Studio" | "Outdoor">("Studio");
  const [locationName, setLocationName] = useState("");
  const [pricing, setPricing] = useState("35.00");
  const [maxSlots, setMaxSlots] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(60);

  // New rule form
  const [newDayOfWeek, setNewDayOfWeek] = useState(1);
  const [newStartTime, setNewStartTime] = useState("07:00");
  const [newEndTime, setNewEndTime] = useState("08:00");

  // Query 1: Fetch session type details
  const {
    data: sessionType,
    isLoading: typeLoading,
    error,
  } = useQuery({
    queryKey: ["admin-session-type-details", typeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("session_types")
        .select("*")
        .eq("id", typeId)
        .single();

      if (error) throw error;
      return data as any;
    },
  });

  // Query 2: Fetch availability rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ["admin-session-rules", typeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_rules")
        .select("*")
        .eq("session_type_id", typeId);

      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    if (sessionType) {
      setTitle(sessionType.title);
      setDescription(sessionType.description || "");
      setFocus(sessionType.focus);
      setLocationType(sessionType.location_type);
      setLocationName(sessionType.location_name);
      setPricing(Number(sessionType.pricing).toFixed(2));
      setMaxSlots(sessionType.max_slots);
      setDurationMinutes(sessionType.duration_minutes);
    }
  }, [sessionType]);

  // Edit template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("session_types")
        .update({
          title,
          description,
          focus,
          location_type: locationType,
          location_name: locationName,
          pricing: parseFloat(pricing),
          max_slots: maxSlots,
          duration_minutes: durationMinutes,
        })
        .eq("id", typeId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Training template updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-session-types"] });
      queryClient.invalidateQueries({ queryKey: ["admin-session-type-details", typeId] });
      router.navigate({ to: "/admin/sessions" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update template.");
    },
  });

  // Add rule mutation
  const addRuleMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("availability_rules")
        .insert({
          session_type_id: typeId,
          day_of_week: newDayOfWeek,
          start_time: newStartTime + ":00",
          end_time: newEndTime + ":00",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Availability rule added!");
      queryClient.invalidateQueries({ queryKey: ["admin-session-rules", typeId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add rule.");
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase.from("availability_rules").delete().eq("id", ruleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Availability rule removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-session-rules", typeId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete rule.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTemplateMutation.mutate();
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    addRuleMutation.mutate();
  };

  const isLoading = typeLoading || rulesLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !sessionType) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <h1 className="text-xl font-bold font-display">Template Not Found</h1>
        <Link to="/admin/sessions" className="mt-4 text-accent hover:underline">
          Back to Templates
        </Link>
      </div>
    );
  }

  const daysText = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        to="/admin/sessions"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 text-accent" /> Back to Templates
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Form: Edit template */}
        <div className="rounded-sm border border-border bg-surface p-8 shadow-lg space-y-8 h-fit">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Edit Template
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Modify training template specifications.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

            <button
              type="submit"
              disabled={updateTemplateMutation.isPending}
              className="flex w-full h-10 items-center justify-center rounded-sm bg-accent text-xs font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 gap-2"
            >
              {updateTemplateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Availability rules */}
        <div className="space-y-6">
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" /> Weekly Recurring Slots
            </h2>

            {!rules || rules.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No recurring slot triggers defined for this template.
              </p>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-3 bg-background rounded-sm border border-border/50 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">
                        {daysText[rule.day_of_week]}
                      </span>
                      <span className="block text-muted-foreground text-[10px] mt-0.5">
                        {rule.start_time.substring(0, 5)} - {rule.end_time.substring(0, 5)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                      disabled={deleteRuleMutation.isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove Slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add slot rule */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" /> Add Availability Rule
            </h3>

            <form onSubmit={handleAddRule} className="space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    Day
                  </label>
                  <select
                    value={newDayOfWeek}
                    onChange={(e) => setNewDayOfWeek(parseInt(e.target.value))}
                    className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
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
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    Start
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    End
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addRuleMutation.isPending}
                className="w-full h-8 flex items-center justify-center rounded-sm bg-accent text-[10px] font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {addRuleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Slot Rule"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
