import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ThingCard from "@/components/ThingCard";
import { supabase } from "@/lib/supabase";
import { useMyVotes } from "@/hooks/useVote";
import type { Profile, Thing } from "@/lib/types";

export default function Search() {
  const [q, setQ] = useState("");
  const [things, setThings] = useState<Thing[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);

  const isPeople = q.startsWith("@");

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setThings([]); setPeople([]); return; }

    const id = setTimeout(async () => {
      setBusy(true);
      if (isPeople) {
        const { data } = await supabase
          .from("profiles").select("*")
          .ilike("username", `%${term.slice(1)}%`).limit(20);
        setPeople((data ?? []) as Profile[]); setThings([]);
      } else {
        const { data } = await supabase
          .from("things_feed").select("*").eq("hidden", false)
          .or(`title.ilike.%${term}%,body.ilike.%${term}%,tags.cs.{${term}}`)
          .order("created_at", { ascending: false }).limit(30);
        setThings((data ?? []) as Thing[]); setPeople([]);
      }
      setBusy(false);
    }, 250);
    return () => clearTimeout(id);
  }, [q, isPeople]);

  const ids = useMemo(() => things.map((t) => t.id), [things]);
  const { votes, cast } = useMyVotes(ids);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <h1 className="font-display text-5xl leading-none tracking-tight dot">Search</h1>
      <p className="mt-3 text-muted">Title, content, or tag — or type @ to find people.</p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-sand/60 bg-ink px-4 py-3">
        <span className="text-muted">{isPeople ? "@" : "⌕"}</span>
        <input
          className="w-full bg-transparent text-cream outline-none placeholder:text-muted"
          placeholder="What are you looking for?" value={q} onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
        {q && <button aria-label="Clear" onClick={() => setQ("")} className="text-muted">✕</button>}
      </div>

      {q.trim().length < 2 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line py-10 text-center label">
          Type at least 2 characters
        </div>
      ) : busy ? (
        <p className="mt-6 text-center text-muted">searching…</p>
      ) : isPeople ? (
        <div className="mt-6 space-y-3">
          {people.map((p) => (
            <Link key={p.id} to={`/u/${p.username}`} className="card flex items-center gap-4 py-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line bg-ink text-lg">
                {p.emoji}
              </span>
              <div className="min-w-0">
                <p className="text-cream">@{p.username}</p>
                {p.bio && <p className="truncate text-sm text-muted">{p.bio}</p>}
              </div>
            </Link>
          ))}
          {people.length === 0 && <p className="mt-6 text-center text-muted">No one by that name.</p>}
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {things.map((t) => (
            <ThingCard key={t.id} thing={t} myVote={votes[t.id]} onVote={(id, v) => cast(id, v)} />
          ))}
          {things.length === 0 && <p className="mt-6 text-center text-muted">Nothing matches that yet.</p>}
        </div>
      )}
    </main>
  );
}
