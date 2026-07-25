import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";

interface AuthValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthValue>({
  session: null, profile: null, loading: true,
  refreshProfile: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) {
        console.warn("Profile load error:", error.message);
        if (error.code === "PGRST116") {
          // Profil henüz oluşmamış olabilir, 1.5 saniye sonra tekrar dene
          setTimeout(async () => {
            const { data: retryData } = await supabase.from("profiles").select("*").eq("id", userId).single();
            if (retryData) setProfile(retryData as Profile);
          }, 1500);
        }
      } else {
        setProfile(data as Profile);
      }
    } catch (e) {
      console.error("Critical profile load error:", e);
    }
  }

  useEffect(() => {
    // 1. Mevcut oturumu kontrol et
    const checkSession = async () => {
      setLoading(true);
      const { data: { session: s }, error } = await supabase.auth.getSession();
      console.log("Initial session check:", s ? "Logged in" : "No session", error || "");
      
      setSession(s);
      if (s) await loadProfile(s.user.id);
      setLoading(false);
    };

    checkSession();

    // 2. Auth durumu değişimlerini dinle (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log("Auth event triggered:", event, s ? "User exists" : "No user");
      
      setSession(s);
      if (s) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
      
      // OAuth (Google) dönüşünde event "SIGNED_IN" olur, bu durumda loading'i kapatmalıyız
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    session, profile, loading,
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
