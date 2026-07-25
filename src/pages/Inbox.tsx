import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";
import { cx, timeAgo } from "@/lib/utils";
import type { Notification, NotifType } from "@/lib/types";

const COPY: Record<NotifType, string> = {
  same: "Someone said Same",
  nah: "Someone said Nah",
  comment: "New comment",
  reply: "Someone replied to you",
  mention: "You were mentioned",
  only_one: "You're the only one",
};

const ICON: Record<NotifType, string> = {
  same: "👍", nah: "👎", comment: "💬", reply: "↩", mention: "@", only_one: "✦",
};

export default function Inbox() {
  const { session } = useAuth();
  const nav = useNavigate();
  const { items, loading, dismiss, dismissMany, togglePin } = useNotifications();
  const [selected, setSelected] = useState<string[]>([]);

  if (!session) {
    return (
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
        <Head />
        <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center text-muted">
          Sign in to see who related.
        </div>
        <button onClick={() => nav("/auth")} className="btn-primary mx-auto mt-6 block">Sign in</button>
      </main>
    );
  }

  const selecting = selected.length > 0;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <Head />

      {selecting && (
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-sand/40 bg-sand/10 px-4 py-3">
          <span className="text-sm text-cream">{selected.length} selected</span>
          <div className="flex gap-4 text-sm">
            <button className="text-muted" onClick={() => setSelected([])}>Cancel</button>
            <button className="text-sand" onClick={() => { dismissMany(selected); setSelected([]); }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {items.map((n) => (
          <Row
            key={n.id}
            n={n}
            selected={selected.includes(n.id)}
            selecting={selecting}
            onOpen={() => (selecting ? toggleSelect(n.id) : n.thing_id && nav(`/t/${n.thing_id}`))}
            onHold={() => toggleSelect(n.id)}
            onDismiss={() => dismiss(n.id)}
            onPin={() => togglePin(n.id)}
          />
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-line px-6 py-12 text-center text-muted">
          Nothing yet. Drop a thing and see who relates.
        </div>
      )}
    </main>
  );

  function toggleSelect(id: string) {
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }
}

function Head() {
  return (
    <>
      <h1 className="font-display text-5xl leading-none tracking-tight dot">Inbox</h1>
      <p className="mt-3 text-muted">Swipe ← to dismiss · swipe → to pin · hold to select</p>
    </>
  );
}

function Row({ n, selected, selecting, onOpen, onHold, onDismiss, onPin }: {
  n: Notification;
  selected: boolean;
  selecting: boolean;
  onOpen: () => void;
  onHold: () => void;
  onDismiss: () => void;
  onPin: () => void;
}) {
  const [dx, setDx] = useState(0);
  const start = useRef(0);
  const held = useRef(false);
  const timer = useRef<number>();

  function down(x: number) {
    start.current = x;
    held.current = false;
    timer.current = window.setTimeout(() => { held.current = true; onHold(); }, 450);
  }
  function move(x: number) {
    const d = x - start.current;
    if (Math.abs(d) > 8) window.clearTimeout(timer.current);
    setDx(Math.max(-120, Math.min(120, d)));
  }
  function up() {
    window.clearTimeout(timer.current);
    if (dx < -80) onDismiss();
    else if (dx > 80) onPin();
    else if (!held.current && Math.abs(dx) < 8) onOpen();
    setDx(0);
  }

  return (
    <div className="relative overflow-hidden rounded-[26px]">
      {/* swipe arkasindaki niyet: sol = at, sag = sabitle */}
      <div className="absolute inset-0 flex items-center justify-between px-6 text-sm">
        <span className={cx("text-sand transition-opacity", dx > 30 ? "opacity-100" : "opacity-0")}>Pin</span>
        <span className={cx("text-muted transition-opacity", dx < -30 ? "opacity-100" : "opacity-0")}>Dismiss</span>
      </div>

      <button
        onPointerDown={(e) => down(e.clientX)}
        onPointerMove={(e) => e.buttons === 1 && move(e.clientX)}
        onPointerUp={up}
        onPointerLeave={() => { window.clearTimeout(timer.current); setDx(0); }}
        style={{ transform: `translateX(${dx}px)` }}
        className={cx(
          "card relative flex w-full touch-pan-y items-start gap-4 text-left transition-transform",
          (n.pinned || selected) && "border-sand/50",
          n.type === "only_one" && "border-rare/40",
          !dx && "duration-200"
        )}
      >
        <span className={cx(
          "grid h-11 w-11 shrink-0 place-items-center rounded-full border bg-ink text-sm",
          n.type === "only_one" ? "border-rare/50 text-rare" : "border-line"
        )}>
          {ICON[n.type]}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {n.pinned && <span className="text-sand">⚲</span>}
            <span className={cx("label", n.type === "only_one" && "text-rare")}>{COPY[n.type]}</span>
            <span className="ml-auto shrink-0 text-sm text-muted">{timeAgo(n.created_at)}</span>
          </div>
          {n.preview && (
            <p className="mt-1.5 truncate font-display text-lg text-cream">{n.preview}</p>
          )}
        </div>

        {selecting && (
          <span className={cx("mt-1 h-5 w-5 shrink-0 rounded-full border", selected ? "border-sand bg-sand" : "border-line")} />
        )}
      </button>
    </div>
  );
}
