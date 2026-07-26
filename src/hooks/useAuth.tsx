import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue>({
  session: null, profile: null, loading: true, error: null,
  refreshProfile: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile(userId: string) {
    try {
      const { data, error: profileError } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (profileError) {
        if (profileError.code === "PGRST116") {
          // Profil yoksa, auth.users'dan bilgi alıp bekle (Trigger calisiyor olmali)
          setTimeout(async () => {
            const { data: retry } = await supabase.from("profiles").select("*").eq("id", userId).single();
            if (retry) setProfile(retry as Profile);
          }, 2000);
        } else {
          setError("Profile error: " + profileError.message);
        }
      } else {
        setProfile(data as Profile);
      }
    } catch (e: any) {
      setError("Critical profile error: " + e.message);
    }
  }

  useEffect(() => {
    // URL'deki hash'i kontrol et (OAuth donusu icin)
    if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
      console.log("OAuth hash detected, waiting for Supabase to process...");
    }

    const initAuth = async () => {
      try {
        const { data: { session: s }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) setError("Session error: " + sessionError.message);
        
        setSession(s);
        if (s) await loadProfile(s.user.id);
      } catch (e: any) {
        setError("Init error: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log("Auth Event:", event);
      setSession(s);
      if (s) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    session, profile, loading, error,
    refreshProfile: async () => { if (session) await loadProfile(session.user.id); },
    signOut: async () => { 
      setLoading(true);
      await supabase.auth.signOut(); 
      setSession(null);
      setProfile(null);
      setLoading(false);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
