import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MentionText from "@/components/MentionText";
import SimilarityBar from "@/components/SimilarityBar";
import CommentCard from "@/components/CommentCard";
import ReportMenu from "@/components/ReportMenu";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useMyVotes } from "@/hooks/useVote";
import { useToast } from "@/hooks/useToast";
import { cx, timeAgo } from "@/lib/utils";
import type { Comment, Thing, VoteValue } from "@/lib/types";

export default function ThingDetail() {
  const { id = "" } = useParams();
  const { session } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const [thing, setThing] = useState<Thing | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [draftAnon, setDraftAnon] = useState(false);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyAnon, setReplyAnon] = useState(false);
  const [menu, setMenu] = useState(false);

  const { votes, cast } = useMyVotes(id ? [id] : []);
  const myVote = votes[id];

  async function loadThing() {
    const { data } = await supabase.from("things_feed").select("*").eq("id", id).single();
    setThing(data as Thing);
  }
  async function loadComments() {
    const { data } = await supabase
      .from("comments_view").select("*").eq("thing_id", id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: true });
    setComments((data ?? []) as Comment[]);
  }

  useEffect(() => { loadThing(); loadComments(); }, [id]);

  async function vote(v: VoteValue) {
    if (!session) return nav("/auth");
    if (myVote) return;
    const { error } = await cast(id, v);
    if (error && error !== "already-voted") return toast(String(error), "error");
    loadThing();
  }

  async function send(body: string, anon: boolean, parent: string | null) {
    if (!session) return nav("/auth");
    if (body.trim().length < 1) return;
    const { error } = await supabase.from("comments").insert({
      thing_id: id, user_id: session.user.id,
      parent_id: parent, body: body.trim(), is_anonymous: anon,
    });
    if (error) return toast(error.message, "error");
    setDraft(""); setReplyDraft(""); setReplyTo(null);
    loadComments(); loadThing();
  }

  async function togglePin(c: Comment) {
    const next = !c.pinned;
    const { error } = await supabase.from("comments").update({ pinned: next }).eq("id", c.id);
    if (error) return toast(error.message.includes("up to 3")
      ? "You can pin up to 3 comments. Unpin one first." : error.message, "error");
    toast(next ? "Pinned to the top." : "Unpinned.", "good");
    loadComments();
  }

  if (!thing) return <main className="px-5 py-20 text-center text-muted">loading…</main>;

  const isOwner = thing.user_id === session?.user.id;
  const revealed = Boolean(myVote) || isOwner;
  const roots = comments.filter((c) => !c.parent_id);

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <Link to="/" className="label">‹ Back to feed</Link>

      <article className={cx("card mt-5 space-y-5", thing.is_featured && "border-sand/40",
                             thing.is_rare && "border-rare/40")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-line bg-ink text-sm">
            {thing.is_anonymous ? "?" : thing.emoji}
          </span>
          {thing.is_anonymous ? (
            <span className="text-sm text-muted">anonymous</span>
          ) : (
            <Link to={`/u/${thing.username}`} className="text-sm text-cream">@{thing.username}</Link>
          )}
          {isOwner && <Badge tone="on">MYTHING.</Badge>}
          {thing.is_rare && <Badge tone="rare">✦ RARE THING</Badge>}
          {thing.is_featured && !thing.is_rare && <Badge tone="on">✧ FEATURED</Badge>}
          {thing.tags.map((t) => <Badge key={t}>{t.toUpperCase()}</Badge>)}

          <div className="relative ml-auto">
            <button aria-label="More" onClick={() => setMenu((m) => !m)} className="px-2 text-muted">···</button>
            {menu && <ReportMenu thingId={thing.id} onClose={() => setMenu(false)} />}
          </div>
        </div>

        {thing.hidden && (
          <p className="rounded-2xl border border-rare/40 bg-rare/5 px-4 py-3 text-sm text-rare">
            Hidden by our safety filter{thing.hidden_reason ? `: ${thing.hidden_reason}` : "."} Only you can see it.
          </p>
        )}

        {thing.title && (
          <MentionText text={thing.title} className="block font-display text-3xl italic leading-snug text-cream" />
        )}
        <MentionText text={thing.body} className="block whitespace-pre-wrap leading-relaxed text-cream/90" />

        {revealed ? (
          <SimilarityBar same={thing.same_votes} total={thing.total_votes} myVote={myVote} />
        ) : (
          <p className="text-sm text-muted">
            Answer first — then you'll see how many people are with you. One vote, no takebacks.
          </p>
        )}

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => vote("same")} disabled={Boolean(myVote)} aria-pressed={myVote === "same"}
                    className={cx("rounded-full py-3.5 font-medium transition-colors",
                                  myVote === "same" ? "bg-sand text-ink" : "bg-raised text-sand",
                                  myVote && myVote !== "same" && "opacity-30")}>
              Same
            </button>
            <button onClick={() => vote("nah")} disabled={Boolean(myVote)} aria-pressed={myVote === "nah"}
                    className={cx("rounded-full py-3.5 font-medium transition-colors",
                                  myVote === "nah" ? "bg-cream text-ink" : "bg-raised text-cream",
                                  myVote && myVote !== "nah" && "opacity-30")}>
              Nah
            </button>
          </div>
          {myVote && (
            <p className="text-center text-xs text-muted">
              You said {myVote === "same" ? "Same" : "Nah"}. That's final.
            </p>
          )}
        </div>
      </article>

      <h2 className="mt-10 font-display text-3xl tracking-tight dot">
        {thing.comment_count} {thing.comment_count === 1 ? "comment" : "comments"}
      </h2>

      {thing.comments_closed ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line py-5 text-center text-sm text-muted">
          Comments are closed on this thing.
        </p>
      ) : session ? (
        <Composer
          value={draft} onChange={setDraft}
          anon={draftAnon} onAnon={setDraftAnon}
          placeholder="Add your thoughts…" action="Send"
          onSend={() => send(draft, draftAnon, null)}
        />
      ) : (
        <button onClick={() => nav("/auth")} className="btn-primary mx-auto mt-5 block">Sign in to comment</button>
      )}

      <div className="mt-5 space-y-3">
        {roots.map((c) => (
          <div key={c.id} className="space-y-3">
            <CommentCard
              c={c} isOwner={isOwner}
              canReply={!thing.comments_closed && Boolean(session)}
              onReply={() => { setReplyTo(c); setReplyDraft(""); }}
              onTogglePin={() => togglePin(c)}
            />

            {replyTo?.id === c.id && (
              <div className="ml-6">
                <Composer
                  value={replyDraft} onChange={setReplyDraft}
                  anon={replyAnon} onAnon={setReplyAnon}
                  placeholder="Write a reply…" action="Reply"
                  onCancel={() => setReplyTo(null)}
                  onSend={() => send(replyDraft, replyAnon, c.id)}
                />
              </div>
            )}

            {comments.filter((r) => r.parent_id === c.id).map((r) => (
              <div key={r.id} className="ml-6 border-l border-line pl-4">
                <CommentCard
                  c={r} isOwner={isOwner}
                  canReply={!thing.comments_closed && Boolean(session)}
                  onReply={() => { setReplyTo(c); setReplyDraft(`@${r.username ?? ""} `.trim() + " "); }}
                  onTogglePin={() => togglePin(r)}
                />
              </div>
            ))}
          </div>
        ))}

        {roots.length === 0 && !thing.comments_closed && (
          <p className="rounded-2xl border border-dashed border-line py-10 text-center text-muted">
            No one's said anything yet. Go first.
          </p>
        )}
      </div>
    </main>
  );
}

/** Yorum ve yanıt aynı kutu: metin, anonim kutucuğu, tek eylem. */
function Composer({ value, onChange, anon, onAnon, placeholder, action, onSend, onCancel }: {
  value: string; onChange: (v: string) => void;
  anon: boolean; onAnon: (v: boolean) => void;
  placeholder: string; action: string;
  onSend: () => void; onCancel?: () => void;
}) {
  return (
    <div className="card mt-5 space-y-4">
      <textarea
        rows={3} maxLength={500} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none bg-transparent leading-relaxed text-cream outline-none placeholder:text-muted"
      />
      <div className="flex items-center gap-4 border-t border-line pt-4">
        <button role="checkbox" aria-checked={anon} onClick={() => onAnon(!anon)}
                className="flex items-center gap-3 text-muted">
          <span className={cx("grid h-6 w-6 place-items-center rounded-md border text-xs",
                              anon ? "border-sand bg-sand text-ink" : "border-line")}>
            {anon && "✓"}
          </span>
          anonymous
        </button>
        <div className="ml-auto flex items-center gap-5">
          {onCancel && <button onClick={onCancel} className="text-sm text-cream">Cancel</button>}
          <button onClick={onSend} disabled={!value.trim()} className="btn-primary px-8">{action}</button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "on" | "rare" }) {
  return (
    <span className={cx("rounded-full border px-2.5 py-1 text-[10px] tracking-[0.14em]",
                        tone === "rare" ? "border-rare/50 bg-rare/10 text-rare"
                        : tone === "on" ? "border-sand/40 bg-sand/10 text-sand"
                        : "border-line text-muted")}>
      {children}
    </span>
  );
}
