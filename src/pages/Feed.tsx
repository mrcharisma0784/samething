import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ThingCard from "@/components/ThingCard";
import { useThings, type Sort } from "@/hooks/useThings";
import { useMyVotes } from "@/hooks/useVote";
import { useAuth } from "@/hooks/useAuth";
import { CORE_TAGS } from "@/lib/constants";
import { cx } from "@/lib/utils";

export default function Feed() {
  const { profile } = useAuth();
  const [sort, setSort] = useState<Sort>("new");
  const [tag, setTag] = useState("all");
  const lang = profile?.feed_lang ?? "en";

  const { things, loading, done, loadMore, patch } = useThings({ sort, tag, lang });
  const ids = useMemo(() => things.map((t) => t.id), [things]);
  const { votes, cast } = useMyVotes(ids);

  async function onVote(id: string, value: "same" | "nah") {
    const t = things.find((x) => x.id === id);
    if (!t || votes[id]) return;   // oy kesin — ikinci kez sayilmaz
    const total = t.total_votes + 1;
    const same = t.same_votes + (value === "same" ? 1 : 0);
    patch(id, { total_votes: total, same_votes: same, similarity: same / total });
    await cast(id, value);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <h1 className="font-display text-6xl leading-none tracking-tight dot">
        {sort === "new" ? "Today" : "Trending"}
      </h1>
      <p className="mt-3 text-muted">
        {loading ? "loading…" : `${things.length}${done ? "" : "+"} thing${things.length === 1 ? "" : "s"} · global`}
      </p>

      {/* siralama + tag filtresi, tek satir, yatay kaydirmali */}
      <div className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(["new", "trending"] as Sort[]).map((s) => (
          <button key={s} onClick={() => setSort(s)}
                  className={cx("chip shrink-0 uppercase tracking-[0.14em]", sort === s && "border-sand bg-sand text-ink")}>
            {s}
          </button>
        ))}
        <span className="self-center px-1 text-muted">·</span>
        {["all", ...CORE_TAGS].map((t) => (
          <button key={t} onClick={() => setTag(t)} className={cx("chip shrink-0", tag === t && "chip-on")}>
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {things.map((t) => (
          <ThingCard
            key={t.id} thing={t} myVote={votes[t.id]} onVote={onVote}
            /* Oyunu verdiysen sonucu görürsün. */
            owned={Boolean(votes[t.id])}
          />
        ))}
      </div>

      {!loading && things.length === 0 && (
        <div className="card mt-6 py-14 text-center">
          <p className="font-display text-3xl dot">SameThing</p>
          <p className="mt-3 font-display text-xl italic text-cream">No things yet.</p>
          <p className="mt-1 text-muted">Be the first to drop one.</p>
          <Link to="/drop" className="btn-primary mt-6 inline-block">Drop a Thing</Link>
        </div>
      )}

      {!done && things.length > 0 && (
        <button onClick={loadMore} className="btn mx-auto mt-6 block">Load more</button>
      )}
    </main>
  );
}
