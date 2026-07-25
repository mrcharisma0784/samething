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
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error && error.code === "PGRST116") {
      // Profil yoksa trigger'in calismasini bekle veya manuel dene.
      // Genelde trigger calisir ama bazen yarim saniye surebilir.
      console.log("Profile not found, waiting for trigger...");
      setTimeout(async () => {
        const { data: retryData } = await supabase.from("profiles").select("*").eq("id", userId).single();
        setProfile((retryData as Profile) ?? null);
      }, 1000);
    } else {
      setProfile((data as Profile) ?? null);
    }
  }

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    };

    initSession();

    // HashRouter'da OAuth donusu bazen URL'deki fragment (#) nedeniyle 
    // otomatik yakalanamayabilir. Bunu zorlamak icin:
    if (window.location.hash.includes("access_token")) {
      initSession();
    }

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      console.log("Auth event:", event);
      setSession(s);
      if (s) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    session, profile, loading,
    refreshProfile: async () => { if (session) await loadProfile(session.user.id); },
    signOut: async () => { await supabase.auth.signOut(); },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
