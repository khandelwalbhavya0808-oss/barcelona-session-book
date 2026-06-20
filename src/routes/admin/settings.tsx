import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { getSiteSettingsFn, updateSiteSettingsFn } from "@/lib/api/admin.functions";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Calendar, Settings, Plus, Trash2, Globe, Clock, Mail, Save } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionNotes, setExceptionNotes] = useState("");

  // Site Settings state
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(24);
  const [contactEmail, setContactEmail] = useState("");

  // Query: Fetch Site Settings
  const { data: siteSettings, isLoading: siteSettingsLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      return await getSiteSettingsFn();
    },
  });

  useEffect(() => {
    if (siteSettings) {
      setMaintenanceMode(siteSettings.maintenance_mode);
      setGracePeriod(siteSettings.cancellation_grace_period_hours);
      setContactEmail(siteSettings.contact_email);
    }
  }, [siteSettings]);

  // Query: Fetch exceptions
  const {
    data: exceptions,
    isLoading: exceptionsLoading,
    error,
  } = useQuery({
    queryKey: ["admin-exceptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_exceptions")
        .select(
          `
          *,
          session_types (
            title
          )
        `,
        )
        .order("exception_date", { ascending: true });

      if (error) throw error;
      return data as any[];
    },
  });

  // Slot generation mutation
  const generateSlotsMutation = useMutation({
    mutationFn: async () => {
      const result = await generateUpcomingSessions();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: (data) => {
      toast.success(data.message || `Successfully generated slots!`);
      queryClient.invalidateQueries({ queryKey: ["scheduled-sessions-public"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard-today-sessions"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate session slots.");
    },
  });

  // Create exception mutation
  const addExceptionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("availability_exceptions")
        .insert({
          exception_date: exceptionDate,
          notes: exceptionNotes || "Blocked holiday/closure",
          is_cancelled: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Date exception blocked successfully!");
      setExceptionDate("");
      setExceptionNotes("");
      queryClient.invalidateQueries({ queryKey: ["admin-exceptions"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to block date.");
    },
  });

  // Delete exception mutation
  const deleteExceptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availability_exceptions").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Date exception removed.");
      queryClient.invalidateQueries({ queryKey: ["admin-exceptions"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete exception.");
    },
  });

  // Update site settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      return await updateSiteSettingsFn({
        data: {
          maintenance_mode: maintenanceMode,
          cancellation_grace_period_hours: gracePeriod,
          contact_email: contactEmail,
        },
      });
    },
    onSuccess: () => {
      toast.success("Global settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-site-settings"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update settings.");
    },
  });

  const handleAddException = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exceptionDate) return;
    addExceptionMutation.mutate();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate();
  };

  const isLoading = exceptionsLoading || siteSettingsLoading;

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
        Failed to load settings. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-10">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          System Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure availability exceptions and manually trigger slot generation engine.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_1.5fr]">
        {/* Left Column: Settings and Engine */}
        <div className="space-y-6">
          {/* Global Site Settings */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" /> Global Settings
            </h2>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-foreground mb-0.5">
                      Maintenance Mode
                    </label>
                    <p className="text-[10px] text-muted-foreground">Blocks all non-admin access</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                      maintenanceMode ? "bg-destructive" : "bg-muted"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        maintenanceMode ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Cancellation Grace Period (Hours)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={gracePeriod}
                    onChange={(e) => setGracePeriod(parseInt(e.target.value) || 0)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Bookings cancelled within this window before the session start time will be
                    marked as "late cancelled".
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updateSettingsMutation.isPending || !siteSettings}
                className="w-full h-8 flex items-center justify-center rounded-sm bg-foreground text-background text-[10px] font-semibold uppercase tracking-wider hover:bg-foreground/90 disabled:opacity-50 gap-2"
              >
                {updateSettingsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-3 w-3" /> Save Settings
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Slot generation engine trigger */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-6 h-fit">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Settings className="h-4 w-4 text-accent" /> Generation Engine
            </h2>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Triggering slot generation will compute all active availability rules for the next 28
              days and create individual calendar sessions if they don't already exist.
            </p>

            <button
              onClick={() => generateSlotsMutation.mutate()}
              disabled={generateSlotsMutation.isPending}
              className="w-full h-10 flex items-center justify-center rounded-sm bg-accent text-xs font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90 disabled:opacity-50 gap-2"
            >
              {generateSlotsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Generate slots (4 Weeks)"
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Availability Exceptions */}
        <div className="space-y-6">
          {/* Add exception date */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" /> Block Specific Date
            </h3>

            <form onSubmit={handleAddException} className="space-y-4 text-xs">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    required
                    value={exceptionDate}
                    onChange={(e) => setExceptionDate(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                    Internal notes
                  </label>
                  <input
                    type="text"
                    value={exceptionNotes}
                    onChange={(e) => setExceptionNotes(e.target.value)}
                    placeholder="E.g. Studio holiday, Christmas closure"
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addExceptionMutation.isPending}
                className="w-full h-8 flex items-center justify-center rounded-sm bg-accent text-[10px] font-semibold uppercase tracking-wider text-accent-foreground hover:opacity-90 disabled:opacity-50"
              >
                {addExceptionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Block Selected Date"
                )}
              </button>
            </form>
          </div>

          {/* Blocked Dates List */}
          <div className="rounded-sm border border-border bg-surface p-6 shadow-sm space-y-4">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" /> Blocked Exceptions
            </h3>

            {!exceptions || exceptions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No blocked exceptions defined in schedule calendar.
              </p>
            ) : (
              <div className="space-y-3">
                {exceptions.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between p-3 bg-background rounded-sm border border-border/50 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-foreground">
                        {format(new Date(ex.exception_date), "EEEE, MMMM d, yyyy")}
                      </span>
                      <span className="block text-muted-foreground text-[10px] mt-0.5">
                        {ex.notes}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteExceptionMutation.mutate(ex.id)}
                      disabled={deleteExceptionMutation.isPending}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove Exception"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
