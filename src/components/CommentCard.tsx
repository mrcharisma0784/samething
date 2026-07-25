import { useState } from "react";
import { Link } from "react-router-dom";
import MentionText from "./MentionText";
import ReportMenu from "./ReportMenu";
import { cx, timeAgo } from "@/lib/utils";
import type { Comment } from "@/lib/types";

interface Props {
  c: Comment;
  /** Bu thing'in sahibi ben miyim — pin yetkisi buradan gelir. */
  isOwner: boolean;
  canReply: boolean;
  onReply: () => void;
  onTogglePin: () => void;
}

export default function CommentCard({ c, isOwner, canReply, onReply, onTogglePin }: Props) {
  const [menu, setMenu] = useState(false);

  return (
    <article className={cx("card space-y-3 py-4", c.pinned && "border-sand/50")}>
      <div className="flex items-center gap-2">
        {c.pinned && <span className="text-sand" title="Pinned by the creator" aria-label="Pinned">⚲</span>}

        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-ink text-sm">
          {c.is_anonymous ? "?" : c.emoji}
        </span>

        {c.is_anonymous ? (
          <span className="text-sm text-muted">anonymous</span>
        ) : (
          <Link to={`/u/${c.username}`} className="text-sm text-cream">@{c.username}</Link>
        )}

        {c.is_creator && (
          <span className="rounded-full bg-raised px-2.5 py-1 text-[10px] tracking-[0.14em] text-sand">
            CREATOR
          </span>
        )}

        <div className="relative ml-auto flex items-center gap-3">
          {isOwner && (
            <button
              onClick={onTogglePin}
              aria-label={c.pinned ? "Unpin comment" : "Pin comment"}
              title={c.pinned ? "Unpin" : "Pin to the top"}
              className={cx("text-lg", c.pinned ? "text-sand" : "text-muted")}
            >
              {c.pinned ? "⚲̸" : "⚲"}
            </button>
          )}
          <button aria-label="Report comment" onClick={() => setMenu((m) => !m)} className="text-muted">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z" />
            </svg>
          </button>
          {menu && <ReportMenu commentId={c.id} onClose={() => setMenu(false)} />}
        </div>
      </div>

      <MentionText text={c.body} className="block leading-relaxed text-cream/90" />

      <div className="flex items-center gap-4 text-sm text-muted">
        <span>{timeAgo(c.created_at)}</span>
        {canReply && <button onClick={onReply} className="text-muted">Reply</button>}
      </div>
    </article>
  );
}
