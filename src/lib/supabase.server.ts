import { createServerClient } from "@supabase/ssr";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

export function createServerSupabase() {
  // Read from process.env on the server.
  const url = process.env.VITE_SUPABASE_URL || "";
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

  if (!url || !anonKey) {
    throw new Error(
      "Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing on the server."
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      get(key) {
        try {
          const cookieHeader = getRequestHeader("cookie") ?? "";
          const cookies = Object.fromEntries(
            cookieHeader.split("; ").map((cookie) => {
              const [name, ...value] = cookie.split("=");
              return [name, value.join("=")];
            })
          );
          return cookies[key];
        } catch (e) {
          return undefined;
        }
      },
      set(key, value, options) {
        try {
          let cookieString = `${key}=${value}`;
          if (options.maxAge !== undefined) cookieString += `; Max-Age=${options.maxAge}`;
          if (options.domain) cookieString += `; Domain=${options.domain}`;
          if (options.path) cookieString += `; Path=${options.path}`;
          if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
          if (options.secure) cookieString += `; Secure`;
          if (options.httpOnly) cookieString += `; HttpOnly`;
          
          setResponseHeader("Set-Cookie", cookieString);
        } catch (e) {
          // Ignore if headers cannot be written (e.g. headers already sent)
        }
      },
      remove(key, options) {
        try {
          let cookieString = `${key}=; Max-Age=0`;
          if (options.domain) cookieString += `; Domain=${options.domain}`;
          if (options.path) cookieString += `; Path=${options.path}`;
          if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
          if (options.secure) cookieString += `; Secure`;
          if (options.httpOnly) cookieString += `; HttpOnly`;
          
          setResponseHeader("Set-Cookie", cookieString);
        } catch (e) {
          // Ignore if headers cannot be written
        }
      },
    },
  });
}
