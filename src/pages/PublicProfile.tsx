import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ThingCard from "@/components/ThingCard";
import { supabase } from "@/lib/supabase";
import { useMyVotes } from "@/hooks/useVote";
import type { Profile, ProfileStats, Thing } from "@/lib/types";

export default function PublicProfile() {
  const { username = "" } = useParams();
  const [p, setP] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [things, setThings] = useState<Thing[]>([]);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    supabase.from("profiles").select("*").eq("username", username).single()
      .then(async ({ data }) => {
        if (!data) return setMissing(true);
        setP(data as Profile);
        const { data: ts } = await supabase.from("things_feed").select("*")
          .eq("user_id", (data as Profile).id).eq("is_anonymous", false).eq("hidden", false)
          .order("created_at", { ascending: false });
        setThings((ts ?? []) as Thing[]);
        const { data: st } = await supabase.from("profile_stats").select("*")
          .eq("profile_id", (data as Profile).id).single();
        setStats(st as ProfileStats);
      });
  }, [username]);

  const ids = useMemo(() => things.map((t) => t.id), [things]);
  const { votes, cast } = useMyVotes(ids);

  if (missing) return <main className="px-5 py-20 text-center text-muted">No one goes by @{username}.</main>;
  if (!p) return <main className="px-5 py-20 text-center text-muted">loading…</main>;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <section className="card space-y-5">
        <div className="flex items-start gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-line bg-ink text-3xl">
            {p.emoji}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-3xl text-cream">@{p.username}</h1>
            {p.bio && <p className="mt-2 text-muted">{p.bio}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-line bg-ink px-5 py-5">
            <p className="font-display text-4xl text-cream">{stats?.things_count ?? 0}</p>
            <p className="mt-1 label">Things</p>
          </div>
          <div className="rounded-2xl border border-line bg-ink px-5 py-5">
            <p className="font-display text-4xl text-rare">{stats?.rare_count ?? 0}</p>
            <p className="mt-1 label">Rare Things</p>
          </div>
        </div>
        {p.plan && (
          <span className="inline-block rounded-full border border-line px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
            {p.plan}
          </span>
        )}
      </section>

      <h2 className="mt-10 font-display text-4xl tracking-tight dot">Public Things</h2>

      <div className="mt-5 space-y-5">
        {things.map((t) => (
          <ThingCard
            key={t.id} thing={t} myVote={votes[t.id]}
            onVote={(id, v) => cast(id, v)}
            /* Oyunu verdiysen sonucu görürsün — kart bandı açar. */
            owned={Boolean(votes[t.id])}
          />
        ))}
        {things.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line py-12 text-center text-muted">
            Nothing public here yet.
          </p>
        )}
      </div>
    </main>
  );
}
