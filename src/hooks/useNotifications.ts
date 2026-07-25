import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { Notification } from "@/lib/types";

export function useNotifications() {
  const { session } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("dismissed", false)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, [session]);

  useEffect(() => { load(); }, [load]);

  // Canli: biri Same derse Inbox aninda dolsun.
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel("inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${session.user.id}` },
        (payload) => setItems((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session]);

  const dismiss = async (id: string) => {
    setItems((p) => p.filter((n) => n.id !== id));
    await supabase.from("notifications").update({ dismissed: true }).eq("id", id);
  };

  const togglePin = async (id: string) => {
    const item = items.find((n) => n.id === id);
    if (!item) return;
    const pinned = !item.pinned;
    setItems((p) =>
      [...p.map((n) => (n.id === id ? { ...n, pinned } : n))]
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || +new Date(b.created_at) - +new Date(a.created_at))
    );
    await supabase.from("notifications").update({ pinned }).eq("id", id);
  };

  const dismissMany = async (ids: string[]) => {
    setItems((p) => p.filter((n) => !ids.includes(n.id)));
    await supabase.from("notifications").update({ dismissed: true }).in("id", ids);
  };

  const unread = items.filter((n) => !n.read).length;

  return { items, loading, unread, dismiss, dismissMany, togglePin, reload: load };
}
