import { createServerFn } from "@tanstack/react-start";
import { createServerSupabase, createServerSupabaseServiceRole } from "../supabase.server";
import { z } from "zod";

// Helper to verify admin
async function verifyAdmin() {
  const supabase = createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }

  return { user, supabase };
}

export const getAdminDashboardStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await verifyAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // 1. Total Clients
  const { count: clientsCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .in("role", ["client", "user"]);

  // 2. Weekly Bookings
  const { data: weeklyBookings } = await supabase
    .from("bookings")
    .select("id, status")
    .gte("created_at", oneWeekAgo.toISOString());

  // 3. Today's Sessions
  const { data: todaySessions } = await supabase
    .from("scheduled_sessions")
    .select(`
      id,
      start_time,
      end_time,
      location_name,
      max_slots,
      session_types (
        title,
        focus,
        duration_minutes
      ),
      bookings (
        id,
        status,
        client_id,
        profiles (
          full_name,
          email
        )
      )
    `)
    .gte("start_time", todayStart.toISOString())
    .lte("start_time", todayEnd.toISOString())
    .order("start_time", { ascending: true });

  return {
    clientsCount: clientsCount || 0,
    weeklyBookings: weeklyBookings || [],
    todaySessions: todaySessions || [],
  };
});

export const updateBookingStatusFn = createServerFn({ method: "POST" })
  .validator(z.object({
    bookingId: z.string().uuid(),
    status: z.enum(["confirmed", "cancelled", "late_cancelled", "attended", "no-show"])
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    
    // Using service role to bypass any weird RLS for admin mutations if needed,
    // but the client context as admin usually suffices.
    const { data: result, error } = await supabase
      .from("bookings")
      .update({ status: data.status })
      .eq("id", data.bookingId)
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const getAdminClientsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await verifyAdmin();

  const { data: clients, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return clients || [];
});

export const updateClientRoleFn = createServerFn({ method: "POST" })
  .validator(z.object({
    clientId: z.string().uuid(),
    role: z.enum(["user", "client", "admin"]).optional(),
    status: z.enum(["active", "banned", "rejected"]).optional()
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    
    const updates: any = {};
    if (data.role) updates.role = data.role;
    if (data.status) updates.status = data.status;

    // Using service role might be needed to bypass RLS for updating other users' profiles,
    // but the `is_admin` RLS policy on profiles allows admins to UPDATE any profile.
    const { data: result, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", data.clientId)
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const getAdminBookingsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      status,
      payment_status,
      created_at,
      scheduled_sessions (
        id,
        start_time,
        end_time,
        location_name,
        session_types (
          title,
          pricing
        )
      ),
      profiles (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
});

export const updateBookingPaymentStatusFn = createServerFn({ method: "POST" })
  .validator(z.object({
    bookingId: z.string().uuid(),
    paymentStatus: z.enum(["pending", "paid"])
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    
    const { data: result, error } = await supabase
      .from("bookings")
      .update({ payment_status: data.paymentStatus })
      .eq("id", data.bookingId)
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const getAdminSessionTypesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("session_types")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
});

export const toggleSessionTypeActiveFn = createServerFn({ method: "POST" })
  .validator(z.object({
    id: z.string().uuid(),
    isActive: z.boolean()
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    
    const { data: result, error } = await supabase
      .from("session_types")
      .update({ is_active: data.isActive })
      .eq("id", data.id)
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const createSessionTypeTemplateFn = createServerFn({ method: "POST" })
  .validator(z.object({
    title: z.string(),
    description: z.string().optional(),
    focus: z.enum(["Strength", "Conditioning", "Mobility"]),
    location_type: z.enum(["Studio", "Outdoor"]),
    location_name: z.string(),
    pricing: z.number(),
    max_slots: z.number(),
    duration_minutes: z.number(),
    addRule: z.boolean(),
    dayOfWeek: z.number().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional()
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    
    // 1. Insert session type template
    const { data: template, error: templateError } = await supabase
      .from("session_types")
      .insert({
        title: data.title,
        description: data.description,
        focus: data.focus,
        location_type: data.location_type,
        location_name: data.location_name,
        pricing: data.pricing,
        max_slots: data.max_slots,
        duration_minutes: data.duration_minutes,
        is_active: true,
      })
      .select()
      .single();

    if (templateError) throw templateError;

    // 2. Insert availability rule if requested
    if (data.addRule && template && data.dayOfWeek !== undefined && data.startTime && data.endTime) {
      const { error: ruleError } = await supabase.from("availability_rules").insert({
        session_type_id: template.id,
        day_of_week: data.dayOfWeek,
        start_time: data.startTime + ":00",
        end_time: data.endTime + ":00",
      });

      if (ruleError) throw ruleError;
    }

    return template;
  });
