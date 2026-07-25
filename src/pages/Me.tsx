import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThingCard from "@/components/ThingCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileStats, Thing } from "@/lib/types";

export default function Me() {
  const { session, profile } = useAuth();
  const nav = useNavigate();
  const [things, setThings] = useState<Thing[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => { if (!session) nav("/auth"); }, [session, nav]);

  useEffect(() => {
    if (!session) return;
    supabase.from("things_feed").select("*").eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setThings((data ?? []) as Thing[]));
    supabase.from("profile_stats").select("*").eq("profile_id", session.user.id).single()
      .then(({ data }) => setStats(data as ProfileStats));
  }, [session]);

  const rare = useMemo(() => things.filter((t) => t.is_rare).length, [things]);

  if (!profile) return null;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <section className="card space-y-5">
        <div className="flex items-start gap-4">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-line bg-ink text-3xl">
            {profile.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl text-cream">@{profile.username}</h1>
              <span className="rounded-full border border-line px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                {profile.plan}
              </span>
            </div>
            {profile.bio && <p className="mt-2 text-muted">{profile.bio}</p>}
          </div>
          <Link to="/settings" aria-label="Settings"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-muted">
            ⚙
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat n={stats?.things_count ?? things.length} label="MyThings" />
          <Stat n={stats?.rare_count ?? rare} label="Rare Things" rare />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link to="/me/edit" className="btn text-center">Edit profile</Link>
          <button disabled className="rounded-full border border-line px-5 py-3 text-sm text-sand/60">
            ✦ Upgrade — soon
          </button>
        </div>
      </section>

      {profile.muted_until && new Date(profile.muted_until) > new Date() && (
        <p className="mt-6 rounded-2xl border border-rare/40 bg-rare/5 px-4 py-4 text-sm text-rare">
          You're muted until {new Date(profile.muted_until).toLocaleString()}. You can read and vote,
          but not post. {profile.strikes} strike{profile.strikes === 1 ? "" : "s"} on your account.
        </p>
      )}

      <h2 className="mt-10 font-display text-4xl tracking-tight dot">MyThings</h2>

      <div className="mt-5 space-y-5">
        {things.map((t) => (
          <ThingCard key={t.id} thing={t} onVote={() => {}} owned />
        ))}
        {things.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line py-12 text-center text-muted">
            Nothing dropped yet. Start with the thought you're sure is only yours.
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ n, label, rare }: { n: number; label: string; rare?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-ink px-5 py-5">
      <p className={`font-display text-4xl ${rare ? "text-rare" : "text-cream"}`}>{n}</p>
      <p className="mt-1 label">{label}</p>
    </div>
  );
}
