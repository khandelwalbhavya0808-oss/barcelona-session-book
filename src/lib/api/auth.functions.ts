import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createServerSupabaseServiceRole } from "../supabase.server";
import { z } from "zod";

export const logUserLogin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const ip = getRequestHeader("x-forwarded-for") || getRequestHeader("x-real-ip") || "127.0.0.1";
    const userAgent = getRequestHeader("user-agent") || "unknown";

    const supabase = await createServerSupabaseServiceRole();
    const { error } = await supabase.from("user_login_history").insert({
      user_id: data.userId,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) {
      console.error("Error logging user login history:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  });
