import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FEED_LANGS } from "@/lib/constants";
import { cx } from "@/lib/utils";

export default function Settings() {
  const { session, profile, refreshProfile, signOut } = useAuth();
  const nav = useNavigate();
  const [lang, setLang] = useState(profile?.feed_lang ?? "en");
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null); // null = panel kapali
  const [sent, setSent] = useState(false);

  async function saveLang() {
    if (!profile) return;
    await supabase.from("profiles").update({ feed_lang: lang }).eq("id", profile.id);
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function sendFeedback() {
    if (!session || !feedback?.trim()) return;
    await supabase.from("feedback").insert({ user_id: session.user.id, body: feedback.trim() });
    setFeedback(null);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
      <h1 className="font-display text-5xl leading-none tracking-tight dot">Settings</h1>

      <div className="mt-8 space-y-3">
        <Row icon="🔔" title="Notifications" hint="What you want to hear about" to="/settings/notifications" />
        <Row icon="🛡" title="Account & privacy" hint="Email, password, mentions, messages, delete" to="/settings/account" />
        <Row icon="✉" title="Send feedback" hint="Bugs, ideas, love — reaches us directly"
             onClick={() => setFeedback(feedback === null ? "" : null)} />
        <Row icon="?" title="FAQ" hint="How SameThing. works" to="/faq" />
      </div>

      <section className="card mt-8 space-y-5">
        <div>
          <p className="label">Feed language</p>
          <p className="mt-2 text-sm text-muted">
            Things are written in the language of whoever dropped them. This picks which ones reach your
            feed — it doesn't translate anything.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FEED_LANGS.map((l) => (
            <button key={l.code} onClick={() => setLang(l.code)}
                    className={cx("chip", lang === l.code && "border-sand bg-sand text-ink")}>
              {l.label}
            </button>
          ))}
        </div>

        <button onClick={saveLang} className="btn-primary w-full py-4">{saved ? "Saved" : "Save"}</button>
      </section>

      <button onClick={async () => { await signOut(); nav("/"); }}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-line py-4 text-cream">
        <span aria-hidden>⇥</span> Sign out
      </button>

      {feedback !== null && (
        <section className="card mt-6 animate-rise space-y-4 border-sand/40">
          <label className="label" htmlFor="fb">Your feedback</label>
          <textarea
            id="fb" rows={5} maxLength={2000} autoFocus
            className="field resize-none border-sand/60 leading-relaxed"
            placeholder="What's on your mind? Bugs, ideas, love…"
            value={feedback} onChange={(e) => setFeedback(e.target.value)}
          />
          <div className="flex items-center justify-end gap-5">
            <button onClick={() => setFeedback(null)} className="text-cream">Cancel</button>
            <button onClick={sendFeedback} disabled={feedback.trim().length < 3} className="btn-primary px-8">
              Send
            </button>
          </div>
        </section>
      )}

      {sent && <p className="mt-4 text-center text-sm text-sand">Sent. Thanks — it reaches us directly.</p>}

      <p className="mt-8 text-center text-sm tracking-[0.14em] text-muted">
        <Link to="/terms">TERMS</Link> · <Link to="/privacy">PRIVACY</Link> · <Link to="/faq">FAQ</Link>
      </p>
    </main>
  );
}

function Row({ icon, title, hint, to, onClick }: {
  icon: string; title: string; hint: string; to?: string; onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-ink text-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-cream">{title}</p>
        <p className="truncate text-sm text-muted">{hint}</p>
      </div>
      <span className="text-muted">›</span>
    </>
  );
  return to
    ? <Link to={to} className="card flex items-center gap-4 py-5">{inner}</Link>
    : <button onClick={onClick} className="card flex w-full items-center gap-4 py-5">{inner}</button>;
}
