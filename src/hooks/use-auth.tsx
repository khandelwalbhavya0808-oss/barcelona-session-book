import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "user" | "client" | "admin";
export type UserStatus = "active" | "rejected" | "banned";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();

      if (error) {
        console.error("Error fetching user profile:", error);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id).then(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
