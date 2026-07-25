import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useAnalysis } from "@/hooks/useAnalysis";
import { CORE_TAGS } from "@/lib/constants";
import { cx, titleFromBody } from "@/lib/utils";

export default function Drop() {
  const { session, profile } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [anon, setAnon] = useState(false);
  const [closed, setClosed] = useState(false);
  const [busy, setBusy] = useState(false);

  const { verdict, phase } = useAnalysis(body);

  useEffect(() => { if (!session) nav("/auth"); }, [session, nav]);

  // Daha once kullandigin ozel tag'ler tekrar cikar.
  useEffect(() => {
    if (!session) return;
    supabase.from("things").select("tags").eq("user_id", session.user.id).limit(50).then(({ data }) => {
      const mine = new Set<string>();
      (data ?? []).forEach((r: any) => r.tags.forEach((t: string) => {
        if (!CORE_TAGS.includes(t as any)) mine.add(t);
      }));
      setExtraTags((p) => [...new Set([...p, ...mine])]);
    });
  }, [session]);

  // AI yeni bir tag onerdiyse listeye dussun; secmeyi kullaniciya birak.
  useEffect(() => {
    const t = verdict?.suggested_new_tag;
    if (t && !CORE_TAGS.includes(t as any)) setExtraTags((p) => (p.includes(t) ? p : [...p, t]));
  }, [verdict?.suggested_new_tag]);

  const suggested = new Set([
    ...(verdict?.suggested_tags ?? []),
    ...(verdict?.suggested_new_tag ? [verdict.suggested_new_tag] : []),
  ]);
  const hasSuggestions = phase === "ready" && suggested.size > 0;
  const unaccepted = [...suggested].filter((t) => !tags.includes(t));

  function toggle(t: string) {
    setTags((p) => {
      if (p.includes(t)) return p.filter((x) => x !== t);
      if (p.length >= 3) { toast("Three tags is the limit. Drop one first."); return p; }
      return [...p, t];
    });
  }

  function acceptSuggestions() {
    setTags((p) => [...p, ...unaccepted].slice(0, 3));
  }

  function addTag() {
    const t = newTag.trim().toLowerCase();
    if (!t) return;
    if (tags.length >= 3) { toast("Three tags is the limit. Drop one first."); return; }
    if (!CORE_TAGS.includes(t as any) && !extraTags.includes(t)) setExtraTags((p) => [...p, t]);
    if (!tags.includes(t)) setTags((p) => [...p, t]);
    setNewTag("");
  }

  async function drop() {
    if (!session) return;

    if (body.trim().length < 3) return toast("Write your thing first (at least 3 characters).", "error");
    if (tags.length === 0) return toast("Pick at least 1 tag.", "error");
    if (phase === "reading") return toast("Still reading your thing — one moment.");
    if (verdict && !verdict.ok) return toast(verdict.blocked_reason ?? "This breaks the rules.", "error");

    setBusy(true);
    const { data, error } = await supabase
      .from("things")
      .insert({
        user_id: session.user.id,
        title: title.trim() || titleFromBody(body),
        body: body.trim(),
        tags,
        lang: verdict?.lang ?? profile?.feed_lang ?? "en",
        is_anonymous: anon,
        comments_closed: closed,
      })
      .select("id")
      .single();
    setBusy(false);

    if (error) return toast(error.message, "error");
    nav(`/t/${(data as any).id}`);
  }

  const blocked = Boolean(verdict && !verdict.ok);
  const ready = body.trim().length >= 3 && tags.length > 0 && !busy && !blocked && phase !== "reading";

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <h1 className="font-display text-5xl leading-none tracking-tight dot">Drop a Thing</h1>
      <p className="mt-3 text-muted">What did you think only you felt?</p>

      <div className="mt-8 space-y-3">
        <label className="label" htmlFor="title">Title (optional)</label>
        <input id="title" className="field" maxLength={120} placeholder="Leave blank — we'll pick one"
               value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="mt-6 space-y-3">
        <label className="label" htmlFor="body">The thing</label>
        <textarea
          id="body" rows={7} maxLength={1000}
          className={cx("field resize-none font-display text-xl italic leading-relaxed",
                        blocked ? "border-rare/60" : "border-sand/60")}
          placeholder="The exact thought, fear, habit, or moment…&#10;use @username to tag someone"
          value={body} onChange={(e) => setBody(e.target.value)}
        />

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">{body.length}/1000</p>
          <Reading phase={phase} />
        </div>

        {blocked && (
          <p className="rounded-2xl border border-rare/40 bg-rare/5 px-4 py-3 text-sm text-rare">
            {verdict!.blocked_reason}
          </p>
        )}

        {verdict?.crisis && (
          <div className="rounded-2xl border border-sand/40 bg-sand/5 px-4 py-4">
            <p className="font-display text-lg italic text-cream">This one sounds heavy.</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              You can still drop it — people here will tell you if they've felt the same. But if you're
              thinking about hurting yourself, please talk to someone tonight, not just to us.
              In Turkey you can reach 112, or Yaşam Hattı at 183.
            </p>
          </div>
        )}

        {verdict?.simplified && (
          <div className="rounded-2xl border border-line px-4 py-4">
            <p className="label">A tighter version</p>
            <p className="mt-2 font-display text-lg italic leading-snug text-cream">{verdict.simplified}</p>
            <div className="mt-3 flex gap-5 text-sm">
              <button onClick={() => setBody(verdict.simplified!)} className="text-sand">Use this</button>
              <button onClick={() => setBody(body)} className="text-muted">Keep mine</button>
            </div>
          </div>
        )}
      </div>

      <div className="card mt-6 space-y-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="label">Tags · pick 1–3</p>
          <span className="text-sm text-muted">({tags.length}/3)</span>
          {hasSuggestions && unaccepted.length > 0 && (
            <button onClick={acceptSuggestions} className="ml-auto text-xs tracking-[0.14em] text-sand">
              ✧ AI SUGGESTIONS READY — TAP TO ACCEPT
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {CORE_TAGS.map((t) => (
            <TagChip key={t} tag={t} on={tags.includes(t)} hinted={suggested.has(t)} onClick={() => toggle(t)} />
          ))}
          {extraTags.map((t) => (
            <TagChip key={t} tag={t} on={tags.includes(t)} hinted={suggested.has(t)} dashed onClick={() => toggle(t)} />
          ))}
        </div>

        <div className="flex gap-2">
          <input className="field flex-1" placeholder="add your own tag…" maxLength={20}
                 value={newTag} onChange={(e) => setNewTag(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
          <button onClick={addTag} className="btn shrink-0">+ add</button>
        </div>
      </div>

      <div className="card mt-6 space-y-5">
        <Toggle on={anon} set={setAnon} title="Post anonymously" hint="Your username stays hidden." />
        <Toggle on={closed} set={setClosed} title="Close to comments" hint="No one can comment on this thing." />
      </div>

      <button onClick={drop} disabled={busy}
              className={cx("mt-6 w-full rounded-full py-4 text-base font-semibold transition-colors",
                            ready ? "bg-sand text-ink" : "bg-raised text-muted")}>
        Drop it →
      </button>
    </main>
  );
}

/** ● ○ ○ READING… — AI'ın metni okuduğu an. Sessizce, yolun kenarında. */
function Reading({ phase }: { phase: string }) {
  if (phase === "idle") return null;
  if (phase === "failed") return <p className="text-sm text-muted">Couldn't read it — post anyway.</p>;
  if (phase === "ready") return <p className="text-xs tracking-[0.14em] text-sand">✧ READ</p>;
  return (
    <p className="flex items-center gap-2 text-xs tracking-[0.14em] text-muted">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted"
                style={{ animationDelay: `${i * 180}ms` }} />
        ))}
      </span>
      READING…
    </p>
  );
}

function TagChip({ tag, on, hinted, dashed, onClick }: {
  tag: string; on: boolean; hinted: boolean; dashed?: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
            className={cx("chip flex items-center gap-1.5", dashed && "border-dashed",
                          on && "chip-on", !on && hinted && "border-sand/50 text-sand")}>
      {hinted && !on && <span aria-label="AI suggestion">✧</span>}
      {tag}
    </button>
  );
}

function Toggle({ on, set, title, hint }: {
  on: boolean; set: (v: boolean) => void; title: string; hint: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-cream">{title}</p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <button role="switch" aria-checked={on} aria-label={title} onClick={() => set(!on)}
              className={cx("h-7 w-12 shrink-0 rounded-full p-1 transition-colors", on ? "bg-sand" : "bg-raised")}>
        <span className={cx("block h-5 w-5 rounded-full bg-ink transition-transform", on && "translate-x-5")} />
      </button>
    </div>
  );
}
