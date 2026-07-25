import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Thing } from "@/lib/types";

export type Sort = "new" | "trending";

interface Args {
  sort: Sort;
  tag: string;      // "all" | tag adi
  lang: string;
  pageSize?: number;
}

const PAGE = 20;

export function useThings({ sort, tag, lang, pageSize = PAGE }: Args) {
  const [things, setThings] = useState<Thing[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (from: number) => {
      let q = supabase.from("things_feed").select("*").eq("lang", lang).eq("hidden", false);

      if (tag !== "all") q = q.contains("tags", [tag]);

      // "Trending" = son 7 gunun en cok oylanani. "New" = duz kronolojik.
      if (sort === "trending") {
        const since = new Date(Date.now() - 7 * 864e5).toISOString();
        q = q.gte("created_at", since)
             .order("total_votes", { ascending: false })
             .order("created_at", { ascending: false });
      } else {
        q = q.order("created_at", { ascending: false });
      }

      const { data, error } = await q.range(from, from + pageSize - 1);
      if (error) { setError(error.message); return []; }
      return (data ?? []) as Thing[];
    },
    [sort, tag, lang, pageSize]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true); setDone(false); setError(null);
    fetchPage(0).then((rows) => {
      if (!alive) return;
      setThings(rows);
      setDone(rows.length < pageSize);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [fetchPage, pageSize]);

  const loadMore = async () => {
    if (done || loading) return;
    const rows = await fetchPage(things.length);
    setThings((prev) => [...prev, ...rows]);
    if (rows.length < pageSize) setDone(true);
  };

  /** Oy sonrasi tek kartı yerinde tazele — tum feed'i yeniden cekme. */
  const patch = (id: string, next: Partial<Thing>) =>
    setThings((prev) => prev.map((t) => (t.id === id ? { ...t, ...next } : t)));

  return { things, loading, done, error, loadMore, patch };
}
