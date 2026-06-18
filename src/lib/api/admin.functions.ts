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

export const getAdminDashboardStatsFn = createServerFn({ method: "GET" })
  .validator(z.object({
    range: z.enum(["today", "7d", "30d", "month"]).default("7d"),
  }))
  .handler(async ({ data: inputData }) => {
    const { supabase } = await verifyAdmin();

    const range = inputData.range;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    let previousPeriodStart = new Date();
    previousPeriodStart.setHours(0, 0, 0, 0);
    let previousPeriodEnd = new Date(periodStart);

    if (range === "today") {
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
      previousPeriodEnd.setHours(23, 59, 59, 999);
    } else if (range === "7d") {
      periodStart.setDate(periodStart.getDate() - 7);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 14);
    } else if (range === "30d") {
      periodStart.setDate(periodStart.getDate() - 30);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 60);
    } else if (range === "month") {
      periodStart.setDate(1);
      previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      previousPeriodStart.setDate(1);
      previousPeriodEnd.setDate(1);
      previousPeriodEnd.setHours(0, 0, 0, 0);
      previousPeriodEnd.setMilliseconds(-1);
    }

    // 1. Total Clients
    const { count: clientsCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["client", "user"]);
      
    const { count: previousClientsCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["client", "user"])
      .lt("created_at", periodStart.toISOString());

    // 2. Period Bookings
    const { data: periodBookings } = await supabase
      .from("bookings")
      .select("id, status")
      .gte("created_at", periodStart.toISOString());

    const { data: previousBookings } = await supabase
      .from("bookings")
      .select("id, status")
      .gte("created_at", previousPeriodStart.toISOString())
      .lt("created_at", periodStart.toISOString());

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
      previousClientsCount: previousClientsCount || 0,
      periodBookings: periodBookings || [],
      previousBookings: previousBookings || [],
      todaySessions: todaySessions || [],
    };
  });

export const getAdminUpcomingSessionsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await verifyAdmin();

  const now = new Date();

  const { data, error } = await supabase
    .from("scheduled_sessions")
    .select(`
      id,
      start_time,
      end_time,
      location_name,
      max_slots,
      session_types (
        title,
        duration_minutes
      )
    `)
    .gte("start_time", now.toISOString())
    .order("start_time", { ascending: true })
    .limit(50);

  if (error) throw error;
  return data || [];
});

export const scheduleSessionFn = createServerFn({ method: "POST" })
  .validator(z.object({
    sessionTypeId: z.string().uuid(),
    startTime: z.string(),
    endTime: z.string(),
    maxSlots: z.number(),
    locationName: z.string(),
    pricing: z.number(),
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    
    const { data: result, error } = await supabase
      .from("scheduled_sessions")
      .insert({
        session_type_id: data.sessionTypeId,
        start_time: data.startTime,
        end_time: data.endTime,
        max_slots: data.maxSlots,
        location_name: data.locationName,
        pricing: data.pricing,
      })
      .select()
      .single();

    if (error) throw error;
    return result;
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

export const createClientFn = createServerFn({ method: "POST" })
  .validator(z.object({
    fullName: z.string(),
    email: z.string().email(),
    role: z.enum(["user", "client"]).default("client"),
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    const serviceRoleSupabase = await createServerSupabaseServiceRole();

    // Create user via Admin API
    const { data: authData, error: authError } = await serviceRoleSupabase.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
      // Generate a random temporary password
      password: Math.random().toString(36).slice(-10) + "A1!",
    });

    if (authError) throw authError;

    // Update profile role
    if (authData.user) {
      await serviceRoleSupabase
        .from("profiles")
        .update({ role: data.role, full_name: data.fullName })
        .eq("id", authData.user.id);
    }

    return authData.user;
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

export const createBookingFn = createServerFn({ method: "POST" })
  .validator(z.object({
    clientId: z.string().uuid(),
    sessionId: z.string().uuid(),
    status: z.enum(["confirmed", "attended", "cancelled"]).default("confirmed"),
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    
    const { data: result, error } = await supabase
      .from("bookings")
      .insert({
        client_id: data.clientId,
        scheduled_session_id: data.sessionId,
        status: data.status,
        payment_status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return result;
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

export const getSiteSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await verifyAdmin();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data;
});

export const updateSiteSettingsFn = createServerFn({ method: "POST" })
  .validator(z.object({
    maintenance_mode: z.boolean(),
    cancellation_grace_period_hours: z.number().min(0),
    contact_email: z.string().email(),
  }))
  .handler(async ({ data }) => {
    const { supabase } = await verifyAdmin();
    
    const { data: result, error } = await supabase
      .from("site_settings")
      .update({
        maintenance_mode: data.maintenance_mode,
        cancellation_grace_period_hours: data.cancellation_grace_period_hours,
        contact_email: data.contact_email
      })
      .eq("id", 1)
      .select()
      .single();

    if (error) throw error;
    return result;
  });

export const getAdminRecentActivityFn = createServerFn({ method: "GET" })
  .validator(z.object({
    filter: z.enum(["all", "user", "admin"]).default("all")
  }))
  .handler(async ({ data: input }) => {
    const { supabase } = await verifyAdmin();

    const { data: bookingLogs, error } = await supabase
      .from("booking_history_log")
      .select(`
        id,
        action,
        notes,
        created_at,
        profiles (
          full_name,
          role
        )
      `)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) throw error;

    let activity = (bookingLogs || []).map((log: any) => ({
      id: log.id,
      type: "booking",
      action: log.action,
      notes: log.notes,
      created_at: log.created_at,
      user: log.profiles?.full_name || "System",
      role: log.profiles?.role || "system"
    }));

    if (input.filter === "user") {
      activity = activity.filter((a) => a.role === "user" || a.role === "client");
    } else if (input.filter === "admin") {
      activity = activity.filter((a) => a.role === "admin");
    }

    return activity.slice(0, 15);
  });
