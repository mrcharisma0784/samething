import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MentionText from "./MentionText";
import ReportMenu from "./ReportMenu";
import SimilarityBar from "./SimilarityBar";
import { useAuth } from "@/hooks/useAuth";
import { cx, timeAgo, voteLabel } from "@/lib/utils";
import type { Thing, VoteValue } from "@/lib/types";

interface Props {
  thing: Thing;
  myVote?: VoteValue;
  onVote: (id: string, value: VoteValue) => void;
  /** MyThings ve "oyunu verdiğin" kartlar: oy butonları yerine similarity bandı. */
  owned?: boolean;
}

export default function ThingCard({ thing: t, myVote, onVote, owned = false }: Props) {
  const { session } = useAuth();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);

  function vote(v: VoteValue) {
    if (!session) return nav("/auth");
    if (myVote) return;           // oy kesin — bir kez verilir
    onVote(t.id, v);
  }

  return (
    <article
      className={cx(
        "card animate-rise space-y-4",
        t.is_featured && !owned && "border-sand/40",
        t.is_rare && "border-rare/40"
      )}
    >
      {/* satır 1: kim, ne, menü */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-ink text-sm">
          {t.is_anonymous ? "?" : t.emoji}
        </span>

        {t.is_anonymous ? (
          <span className="text-sm text-muted">anonymous</span>
        ) : (
          <Link to={`/u/${t.username}`} className="text-sm text-cream">@{t.username}</Link>
        )}

        {owned && <Badge tone="on">MYTHING.</Badge>}
        {t.is_rare && <Badge tone="rare">✦ RARE THING</Badge>}
        {t.is_featured && !owned && !t.is_rare && <Badge tone="on">✧ FEATURED</Badge>}

        {t.tags.map((tag) => (
          <Badge key={tag}>{tag.toUpperCase()}</Badge>
        ))}

        <div className="relative ml-auto">
          <button aria-label="More" className="px-2 text-muted" onClick={() => setMenu((m) => !m)}>···</button>
          {menu && <ReportMenu thingId={t.id} onClose={() => setMenu(false)} />}
        </div>
      </div>

      {/* içerik */}
      <Link to={`/t/${t.id}`} className="block">
        <MentionText
          text={t.title || t.body}
          className="font-display text-2xl italic leading-snug text-cream"
        />
        {t.title && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{t.body}</p>
        )}
      </Link>

      {/* meta */}
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{owned ? timeAgo(t.created_at) : `${voteLabel(t.total_votes)} · ${timeAgo(t.created_at)}`}</span>
        <Link to={`/t/${t.id}`} className="flex items-center gap-1.5">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z" />
          </svg>
          {t.comment_count}
        </Link>
      </div>

      {/* karar */}
      {owned ? (
        <SimilarityBar same={t.same_votes} total={t.total_votes} myVote={myVote} />
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => vote("same")}
              disabled={Boolean(myVote)}
              aria-pressed={myVote === "same"}
              className={cx(
                "rounded-full py-3.5 text-base font-medium transition-colors",
                myVote === "same" ? "bg-sand text-ink" : "bg-raised text-sand",
                myVote && myVote !== "same" && "opacity-30"
              )}
            >
              Same
            </button>
            <button
              onClick={() => vote("nah")}
              disabled={Boolean(myVote)}
              aria-pressed={myVote === "nah"}
              className={cx(
                "rounded-full py-3.5 text-base font-medium transition-colors",
                myVote === "nah" ? "bg-cream text-ink" : "bg-raised text-cream",
                myVote && myVote !== "nah" && "opacity-30"
              )}
            >
              Nah
            </button>
          </div>
          {myVote && (
            <p className="text-center text-xs text-muted">
              You said {myVote === "same" ? "Same" : "Nah"}. That's final.
            </p>
          )}
        </div>
      )}
    </article>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone?: "on" | "rare" }) {
  return (
    <span
      className={cx(
        "rounded-full border px-2.5 py-1 text-[10px] tracking-[0.14em]",
        tone === "rare"
          ? "border-rare/50 bg-rare/10 text-rare"
          : tone === "on"
          ? "border-sand/40 bg-sand/10 text-sand"
          : "border-line text-muted"
      )}
    >
      {children}
    </span>
  );
}
