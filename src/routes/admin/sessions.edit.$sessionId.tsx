import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Calendar } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/sessions/edit/$sessionId")({
  component: AdminSessionsEditPage,
});

function AdminSessionsEditPage() {
  const { sessionId } = Route.useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [focus, setFocus] = useState<"Strength" | "Conditioning" | "Mobility">("Strength");
  const [locationType, setLocationType] = useState<"Studio" | "Outdoor">("Studio");
  const [locationName, setLocationName] = useState("");
  const [pricing, setPricing] = useState("35.00");
  const [maxSlots, setMaxSlots] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // Query: Fetch scheduled session details along with its session type
  const {
    data: session,
    isLoading: typeLoading,
    error,
  } = useQuery({
    queryKey: ["admin-scheduled-session-details", sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sessions")
        .select(`
          *,
          session_types (
            id,
            title,
            description,
            focus,
            location_type,
            location_name,
            pricing,
            duration_minutes
          )
        `)
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data as any;
    },
  });

  useEffect(() => {
    if (session) {
      const type = session.session_types;
      setTitle(type.title);
      setDescription(session.description || type.description || "");
      setFocus(type.focus);
      setLocationType(type.location_type);
      setLocationName(session.location_name || type.location_name);
      setPricing(Number(session.pricing || type.pricing).toFixed(2));
      setMaxSlots(session.max_slots || type.max_slots);
      setDurationMinutes(type.duration_minutes);

      // Parse date & time from start_time
      if (session.start_time) {
        const dt = new Date(session.start_time);
        setDate(format(dt, "yyyy-MM-dd"));
        setTime(format(dt, "HH:mm"));
      }
    }
  }, [session]);

  // Mutation: Update scheduled session and session type
  const updateSessionMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error("No session loaded");

      // 1. Combine date & time to construct start/end timestamps
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      // 2. Update scheduled session instance
      const { error: sessionError } = await supabase
        .from("scheduled_sessions")
        .update({
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          max_slots: maxSlots,
          pricing: parseFloat(pricing),
          location_name: locationName,
          description: description || null,
        })
        .eq("id", sessionId);

      if (sessionError) throw sessionError;

      // 3. Update underlying session type
      if (session.session_types?.id) {
        const { error: typeError } = await supabase
          .from("session_types")
          .update({
            title,
            description: description || null,
            focus,
            location_type: locationType,
            location_name: locationName,
            pricing: parseFloat(pricing),
            max_slots: maxSlots,
            duration_minutes: durationMinutes,
          })
          .eq("id", session.session_types.id);

        if (typeError) throw typeError;
      }
    },
    onSuccess: () => {
      toast.success("Workout session updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-scheduled-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-scheduled-session-details", sessionId] });
      router.navigate({ to: "/admin/sessions" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update session.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !locationName || !date || !time) {
      toast.error("Please fill in all required fields.");
      return;
    }
    updateSessionMutation.mutate();
  };

  if (typeLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <h1 className="text-xl font-bold font-display">Session Not Found</h1>
        <Link to="/admin/sessions" className="mt-4 text-accent hover:underline">
          Back to Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link
        to="/admin/sessions"
        className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 text-accent" /> Back to Sessions
      </Link>

      <div className="rounded-sm border border-border bg-surface p-8 shadow-lg space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Edit Workout Session
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Modify the scheduling and details for this workout session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Main Info */}
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

            {/* Date & Time */}
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
                Start Time *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
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
                Max Capacity (Slots) *
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
            disabled={updateSessionMutation.isPending}
            className="flex w-full h-11 items-center justify-center rounded-sm bg-accent text-sm font-semibold uppercase tracking-wider text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50 gap-2 cursor-pointer"
          >
            {updateSessionMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
