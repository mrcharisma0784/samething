import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { VoteValue } from "@/lib/types";

/**
 * Oy kesindir: bir kez verilir, degistirilemez, geri alinamaz.
 * DB tarafinda da boyle — votes tablosunda update/delete politikasi yok.
 * Zaten oy verilmis bir thing icin cast() hicbir sey yapmaz.
 */
export function useMyVotes(thingIds: string[]) {
  const { session } = useAuth();
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});

  useEffect(() => {
    if (!session || thingIds.length === 0) return;
    supabase
      .from("votes")
      .select("thing_id,value")
      .eq("user_id", session.user.id)
      .in("thing_id", thingIds)
      .then(({ data }) => {
        const map: Record<string, VoteValue> = {};
        (data ?? []).forEach((v: any) => { map[v.thing_id] = v.value; });
        setVotes((prev) => ({ ...prev, ...map }));
      });
  }, [session, thingIds.join(",")]);

  const cast = useCallback(
    async (thingId: string, value: VoteValue) => {
      if (!session) return { error: "sign-in" as const };
      if (votes[thingId]) return { error: "already-voted" as const };

      setVotes((p) => ({ ...p, [thingId]: value })); // iyimser
      const { error } = await supabase
        .from("votes")
        .insert({ thing_id: thingId, user_id: session.user.id, value });

      if (error) {
        setVotes((p) => { const n = { ...p }; delete n[thingId]; return n; });
        return { error: error.message };
      }
      return { error: null };
    },
    [session, votes]
  );

  return { votes, cast };
}
