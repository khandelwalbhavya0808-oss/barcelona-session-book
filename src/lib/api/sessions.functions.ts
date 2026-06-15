import { createServerFn } from "@tanstack/react-start";
import { createServerSupabase, createServerSupabaseServiceRole } from "../supabase.server";
import { z } from "zod";

export const generateUpcomingSessions = createServerFn({ method: "POST" }).handler(async () => {
  // 1. Verify Admin Status
  const supabaseUserClient = createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabaseUserClient.auth.getUser();

  if (userError || !user) {
    console.error("Auth error in slot generation:", userError);
    return { success: false, error: "Unauthorized access: not signed in." };
  }

  const { data: profile, error: profileError } = await supabaseUserClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    console.error("Admin verification error:", profileError, profile);
    return { success: false, error: "Unauthorized access: admin privileges required." };
  }

  // 2. Fetch Active Rules and Exceptions
  const supabaseService = await createServerSupabaseServiceRole();

  const { data: rules, error: rulesError } = await supabaseService.from("availability_rules")
    .select(`
        *,
        session_types (
          id,
          title,
          pricing,
          max_slots,
          location_name,
          is_active
        )
      `);

  if (rulesError) {
    console.error("Error fetching rules:", rulesError);
    return { success: false, error: "Failed to fetch availability rules." };
  }

  const { data: exceptions, error: exceptionsError } = await supabaseService
    .from("availability_exceptions")
    .select("*")
    .eq("is_cancelled", true);

  if (exceptionsError) {
    console.error("Error fetching exceptions:", exceptionsError);
    return { success: false, error: "Failed to fetch availability exceptions." };
  }

  // 3. Generate slots for the next 28 days
  const generatedCount = [];
  const dateLimit = 28;

  // We will retrieve existing scheduled sessions to prevent inserting duplicates.
  const { data: existingSessions, error: existingError } = await supabaseService
    .from("scheduled_sessions")
    .select("session_type_id, start_time");

  if (existingError) {
    console.error("Error fetching existing scheduled sessions:", existingError);
    return { success: false, error: "Failed to fetch existing scheduled sessions." };
  }

  const existingMap = new Set(
    existingSessions.map((s) => `${s.session_type_id}_${new Date(s.start_time).toISOString()}`),
  );

  // Filter out rules where the session type is inactive
  const activeRules = (rules || []).filter(
    (r: any) => r.session_types && r.session_types.is_active,
  );

  for (let offset = 0; offset < dateLimit; offset++) {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + offset);

    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find exceptions for this date
    const dateExceptions = (exceptions || []).filter((e) => e.exception_date === dateStr);

    // Find active rules matching this day of week
    const matchingRules = activeRules.filter((r) => r.day_of_week === dayOfWeek);

    for (const rule of matchingRules) {
      // Check rule date bounds
      if (rule.start_date > dateStr) continue;
      if (rule.end_date && rule.end_date < dateStr) continue;

      // Check exception for this session type
      const hasException = dateExceptions.some((e) => e.session_type_id === rule.session_type_id);
      if (hasException) continue;

      // Construct start and end timestamps in Barcelona local time (or local server time)
      // Since we want to display standard booking, we combine the date and time.
      // In Javascript, constructing new Date("YYYY-MM-DDTXT") parses it as UTC if "Z" is present, or local if none is present.
      // Let's create an ISO-compatible string using the current timezone offset of the server.
      // The start_time is TIMESTAMPTZ, so storing standard Date values will automatically map.
      const startStr = `${dateStr}T${rule.start_time}`;
      const endStr = `${dateStr}T${rule.end_time}`;

      const startTime = new Date(startStr);
      const endTime = new Date(endStr);

      const dupKey = `${rule.session_type_id}_${startTime.toISOString()}`;
      if (existingMap.has(dupKey)) {
        // Already generated
        continue;
      }

      // Insert new session slot
      const sessionType = rule.session_types;
      const insertData = {
        session_type_id: rule.session_type_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        max_slots: sessionType.max_slots,
        pricing: sessionType.pricing,
        location_name: sessionType.location_name,
        status: "active",
      };

      const { data: inserted, error: insertError } = await supabaseService
        .from("scheduled_sessions")
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting scheduled session:", insertError);
      } else if (inserted) {
        generatedCount.push(inserted);
      }
    }
  }

  return {
    success: true,
    count: generatedCount.length,
    message: `Generated ${generatedCount.length} new session slots for the next 4 weeks.`,
  };
});
